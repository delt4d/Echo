(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.echo = {}));
})(this, (function (exports) { 'use strict';

    let EchoData$1 = class EchoData
    {
        #type;
        #content;
        #timeElapsed;
        
        constructor(type, content, timeElapsed) {
            this.#type = type;
            this.#content = content;
            this.#timeElapsed = timeElapsed;
        }

        get type() {
            return this.#type;
        }

        get content() {
            return this.#content;
        }

        get timeElapsed() {
            return this.#timeElapsed;
        }

        static fromJson(json) {
            return new EchoData(json.type, json.content, json.time_elapsed);
        }

        toJson()
        {
            return {
                type: this.#type,
                content: this.#content,
                time_elapsed: this.#timeElapsed,
            }
        }
    };

    class Handler {
        #type;
        #started = false;
        #onStarted;
        #onStopped;
        #onEvent;
        #lastContent;

        constructor(type, onStarted, onStopped, onEvent) {
            this.#type = type;
            this.#onStarted = onStarted ?? (() => {});
            this.#onStopped = onStopped ?? (() => {});
            this.#onEvent = onEvent;
        }

        get started() {
            return this.#started;
        }

        _emit(content, stringfy = false) {
            if (content && content == this.#lastContent)
                return;

            if (stringfy)
                content = JSON.stringify(content);

            if (this.#onEvent) {
                const currentTime = Date.now();
                this.#onEvent(this.#type, content, currentTime);
            }

            this.#lastContent = content;
        }

        setOnEvent(cb) {
            this.#onEvent = cb;
        }

        start() {
            if (this.#started) return;
            this.#onStarted();
            this.#started = true;
        }

        stop() {
            if (!this.#started) return;
            this.#onStopped();
            this.#started = false;
        }

        static _maskInput(value) {
            const createRandomString = (length) => {
                const chars = "_ ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
                let result = "";
                for (let i = 0; i < length; i++) {
                  result += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                return result;
              };
            
            return createRandomString(value.length);
        }

        static _createXPathFromElement(el) {
            /// https://stackoverflow.com/questions/2661818/javascript-get-xpath-of-a-node
            const allNodes = document.getElementsByTagName('*');
            const segs = [];
        
            for (; el && el.nodeType === 1; el = el.parentNode) {
                if (el.hasAttribute('id') && !!el.id) {
                    let uniqueIdCount = 0;
                    for (let n = 0; n < allNodes.length; n++) {
                        if (allNodes[n].hasAttribute('id') && allNodes[n].id === el.id) uniqueIdCount++;
                        if (uniqueIdCount > 1) break;
                    }
                    if (uniqueIdCount === 1) {
                        segs.unshift('id("' + el.getAttribute('id') + '")');
                        return segs.join('/');
                    } else {
                        segs.unshift(el.localName.toLowerCase() + '[@id="' + el.getAttribute('id') + '"]');
                    }
                } 
                else if (el.hasAttribute('class') && el.classList.length > 0) {
                    const className = el.getAttribute('class');
                    let index = 1;
                    for (let sib = el.previousSibling; sib; sib = sib.previousSibling) {
                        if (sib.nodeType === 1 && sib.localName === el.localName && sib.getAttribute('class') === className) {
                            index++;
                        }
                    }
                    segs.unshift(el.localName.toLowerCase() + '[@class="' + className + '"]' + '[' + index + ']');
                } else {
                    let i = 1;
                    for (let sib = el.previousSibling; sib; sib = sib.previousSibling) {
                        if (sib.nodeType === 1 && sib.localName === el.localName) i++;
                    }
                    segs.unshift(el.localName.toLowerCase() + '[' + i + ']');
                }
            }

            return segs.length ? '/' + segs.join('/') : null;
        }    
        
        static lookupElementByXPath(path) { 
            /// https://stackoverflow.com/questions/2661818/javascript-get-xpath-of-a-node
            const evaluator = new XPathEvaluator(); 
            const result = evaluator.evaluate(path, document.documentElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null); 
            return result.singleNodeValue; 
        } 
    }

    const EchoTypes = Object.freeze({
        pageChanges: "PageChanges",
        input: "Input",
        mouseMove: "MouseMove",
        mouseClick: "MouseClick",
        pageResize: "PageResize",
        scroll: "Scroll"
    });

    class EchoMimic
    {
        #iframe;
        #doc;
        #win;
        static #cursor;

        constructor(elementId) {
            this.#iframe = document.getElementById(elementId);
            this.#win = this.#iframe.contentWindow;
            this.#doc = this.#iframe.contentDocument || this.#win.document;

            if (!EchoMimic.#cursor) {
                const cursor = document.createElement("div");
                cursor.id = "cursor";
                
                Object.assign(cursor.style, {
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: "10px",
                    height: "10px",
                    background: "red",
                    borderRadius: "50%",
                    zIndex: 9999,
                    pointerEvents: "none",
                    transition: "transform 0.05",
                });

                this.#iframe.parentElement.appendChild(cursor);

                EchoMimic.#cursor = cursor;
            }
        }

        #moveCursor(x, y) {
            EchoMimic.#cursor.style.left = `${x}px`;
            EchoMimic.#cursor.style.top = `${y}px`;
        }

        static waitAsync(time) {
            return new Promise(r => setTimeout(r, time));
        }

        async executeAsync(json) {
            const data = EchoData.fromJson(json);
            
            // wait to execute
            await EchoMimic.waitAsync(data.timeElapsed);

            switch(data.type) {
                case EchoTypes.pageChanges: {
                    const policy = trustedTypes.createPolicy('echo', {
                        createHTML: (input) => input
                    });

                    const html = policy.createHTML(data.content);

                    this.#doc.open();
                    this.#doc.writeln(html);
                    this.#doc.close();
                    break;
                }

                case EchoTypes.mouseMove: {
                    const { clientX, clientY } = JSON.parse(data.content);
                    const ev = new MouseEvent("mousemove", {
                        bubbles: true,
                        clientX,
                        clientY,
                        view: this.#win
                    });
                    this.#doc.dispatchEvent(ev);

                    this.#moveCursor(clientX, clientY);

                    break;
                }

                case EchoTypes.pageResize: {
                    const { width, height } = JSON.parse(data.content);
                
                    this.#iframe.style.width = `${width}px`;
                    this.#iframe.style.height = `${height}px`;
                
                    break;
                }

                case EchoTypes.input: {
                    const { xpath, value } = JSON.parse(data.content);
                    const el = Handler.lookupElementByXPath(xpath, this.#doc);
                    if (el) el.value = value;
                    break;
                }

                case EchoTypes.scroll: {
                    const { scrollX, scrollY } = JSON.parse(data.content);
                    this.#win.scrollTo(scrollX, scrollY);
                    break;
                }
            }
        }
    }

    class PageChangeHandler extends Handler {
        constructor() {
            const observer = new MutationObserver((a,b) => {
                const clone = document.documentElement.cloneNode(true);
                
                clone.querySelectorAll('input[type="password"]').forEach(input => (input.value = ""));
                clone.querySelectorAll('[data-not-secure]').forEach(el => {
                    if ('value' in el) el.value = "";
                    el.textContent = "";
                });
                clone.querySelectorAll('script').forEach(script => script.remove());
                clone.querySelectorAll('*').forEach(el => {
                    [...el.attributes].forEach(attr => {
                        if (attr.name.startsWith('on')) {
                            el.removeAttribute(attr.name);
                        }
                    });
                });

                const sanitizedContent = clone.outerHTML;

                super._emit(sanitizedContent);
            });

            const targetNode = document.querySelector("html");
            const config = {
                childList: true,      
                attributes: false,
                subtree: true,
                characterData: false       
            };

            const onStart = () => observer.observe(targetNode, config);
            const onStop = () => observer.disconnect();

            super(EchoTypes.pageChanges, onStart, onStop);
        }
    }

    class InputHandler extends Handler {
        constructor() {
            const onInput = (e) => {
                if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
                    const content = {
                        value: Handler._maskInput(e.target.value),
                        xpath: Handler._createXPathFromElement(e.target)
                    };
                    super._emit(content, true);
                }
            };

            const onStart = () => document.addEventListener("input", onInput);
            const onStop = () => document.removeEventListener("input", onInput);

            super(EchoTypes.input, onStart, onStop);
        }
    }

    class MouseMoveHandler extends Handler {
        constructor(throttleMs = 100) {
            let lastEmitTime = 0;

            const onMove = (e) => {
                const now = Date.now();

                if (now - lastEmitTime >= throttleMs) {
                    lastEmitTime = now;

                    const content = {
                        // relative to viewport
                        clientX: e.clientX,
                        clientY: e.clientY,
                        
                        // relative to full page
                        pageX: e.pageX,
                        pageY: e.pageY,

                        // relative to physical screen
                        screenX: e.screenX,
                        screenY: e.screenY
                    };

                    super._emit(content, true);
                }
            };

            const onStart = () => document.addEventListener("mousemove", onMove);
            const onStop = () => document.removeEventListener("mousemove", onMove);

            super(EchoTypes.mouseMove, onStart, onStop);
        }
    }


    class MouseClickHandler extends Handler {
        constructor() {
            const onClick = (e) => {
                const content = {
                    button: e.button,
                    x: e.clientX,
                    y: e.clientY,
                    xpath: Handler._createXPathFromElement(e.target)
                };
                super._emit(content, true);
            };

            const onStart = () => document.addEventListener("click", onClick);
            const onStop = () => document.removeEventListener("click", onClick);

            super(EchoTypes.mouseClick, onStart, onStop);
        }
    }

    class PageResizeHandler extends Handler {
        constructor() {
            const onResize = () => {
                const content = {
                    width: window.innerWidth,
                    height: window.innerHeight
                };
                super._emit(content, true);
            };

            const onStart = () => {
                window.addEventListener("resize", onResize);
                
                super._emit({
                    width: window.innerWidth,
                    height: window.innerHeight
                }, true);
            };
            const onStop = () => window.removeEventListener("resize", onResize);

            super(EchoTypes.pageResize, onStart, onStop);
        }
    }

    class ScrollHandler extends Handler {
        constructor() {
            const onScroll = () => {
                const content = {
                    scrollX: window.scrollX,
                    scrollY: window.scrollY
                };
                super._emit(content, true);
            };

            const onStart = () => window.addEventListener("scroll", onScroll);
            const onStop = () => window.removeEventListener("scroll", onScroll);

            super(EchoTypes.scroll, onStart, onStop);
        }
    }

    var handlers = /*#__PURE__*/Object.freeze({
        __proto__: null,
        InputHandler: InputHandler,
        MouseClickHandler: MouseClickHandler,
        MouseMoveHandler: MouseMoveHandler,
        PageChangeHandler: PageChangeHandler,
        PageResizeHandler: PageResizeHandler,
        ScrollHandler: ScrollHandler
    });

    class EchoRecorder {
        #lastTime;
        #eventsQueue = [];
        #handlers = [];
        #canceled = false;
        #tickMs;

        /**
         * 
         * @param {object} opt 
         * @param {bool} opt.useDefaultHandlers
         * @param {number} opt.tickMs
         */
        constructor(opt) {
            opt = opt || {};
            opt.useDefaultHandlers = opt.useDefaultHandlers !== false;

            this.#tickMs = opt.tickMs || 1000;
            this.#lastTime = Date.now();


            if (opt.useDefaultHandlers) {
                this.addHandler(PageChangeHandler);
                this.addHandler(InputHandler);
                this.addHandler(MouseMoveHandler);
                this.addHandler(MouseClickHandler);
                this.addHandler(PageResizeHandler);
                this.addHandler(ScrollHandler);
            }
        }

        #handleIncomingEvent(type, content, time) {
            const timeElapsed = time - this.#lastTime;
            this.#lastTime = time;

            const data = new EchoData$1(type, content, timeElapsed);
            this.#eventsQueue.push(data);
        }

        #dequeueEvent() {
            return this.#eventsQueue.shift();
        }

        #canDequeueEvent() {
            return this.#eventsQueue.length > 0;
        }

        addHandler(HandlerCls) {
            const onEvent = this.#handleIncomingEvent.bind(this);
            const handler = new HandlerCls();

            this.#handlers.push(handler);

            if (!this.#canceled) {
                handler.setOnEvent(onEvent);
                handler.start();
            }
        }

        cancel() {
            this.#canceled = true;
            this.#handlers.forEach(handler => handler.stop());
        }

        async *getChangesAsync() {
            this.#canceled = false;
            this.#lastTime = Date.now();

            while (!this.#canceled) {
                while (this.#canDequeueEvent()) {
                    yield this.#dequeueEvent();
                }

                await new Promise(resolve => setTimeout(resolve, this.#tickMs));
            }
        }
    }

    exports.EchoData = EchoData$1;
    exports.EchoMimic = EchoMimic;
    exports.EchoRecorder = EchoRecorder;
    exports.EchoTypes = EchoTypes;
    exports.Handlers = handlers;

}));
