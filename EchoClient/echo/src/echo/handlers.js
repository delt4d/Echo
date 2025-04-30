import {Handler} from "./handler";
import {EchoTypes} from "./types";

export class PageChangeHandler extends Handler {
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

export class InputHandler extends Handler {
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

export class MouseMoveHandler extends Handler {
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


export class MouseClickHandler extends Handler {
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

export class PageResizeHandler extends Handler {
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
        }
        const onStop = () => window.removeEventListener("resize", onResize);

        super(EchoTypes.pageResize, onStart, onStop);
    }
}

export class ScrollHandler extends Handler {
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