import {Handler} from "./handler";
import {EchoTypes} from "./types";

export class PageChangeHandler extends Handler {
    /**
     * 
     * @param {EchoEventBus} eventBus
     */
    constructor(eventBus) {
        const observer = new MutationObserver((a,b) => {
            const clone = document.documentElement.cloneNode(true);
            
            clone.querySelectorAll('input[type="password"]').forEach(input => Handler.maskInput(input.value));
            clone.querySelectorAll('[data-no-record]').forEach(el => {
                if ('value' in el) {
                    el.value = Handler.maskInput(el.value);
                }
            });
            clone.querySelectorAll('script').forEach(script => script.remove());
            
            super._emit(clone.outerHTML);
            eventBus?.emit("page-snapshot-rendered");
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

        super(EchoTypes.pageChanges, onStart, onStop, eventBus);
    }
}

export class InputHandler extends Handler {
    /**
     *
     * @param {EchoEventBus} eventBus
     */
    constructor(eventBus) {
        /** @param {InputEvent} e */
        const onInput = (e) => {
            if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
                const content = {
                    value: e.target.type === "password" || "noRecord" in e.target.dataset ? Handler.maskInput(e.target.value) : e.target.value,
                    xpath: Handler.createXPathFromElement(e.target)
                };
                super._emit(content, true);
            }
        };

        const emitAllInputs = () => {
            const inputs = document.querySelectorAll("input, textarea");
            
            for (const el of inputs) {
                if (!document.documentElement.contains(el)) continue;
                
                const content = {
                    value: el.type === "password" || "noRecord" in el.dataset ? Handler.maskInput(el.value) : el.value,
                    xpath: Handler.createXPathFromElement(el)
                };
                
                super._emit(content, true);
            }
        };

        const onStart = () => {
            document.addEventListener("input", onInput);
            eventBus?.on("page-snapshot-rendered", emitAllInputs);
        }
        const onStop = () => {
            document.removeEventListener("input", onInput);
            eventBus?.off("page-snapshot-rendered", emitAllInputs);
        }

        super(EchoTypes.input, onStart, onStop, eventBus);
    }
}

export class MouseMoveHandler extends Handler {
    constructor(_, throttleMs = 100) {
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
                xpath: Handler.createXPathFromElement(e.target)
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