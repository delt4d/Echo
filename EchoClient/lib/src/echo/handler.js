import {EchoEventBus} from "./event-bus.js";

export class Handler {
    #type;
    #started = false;
    #onStarted;
    #onStopped;
    #onEvent;
    #eventBus;
    #lastContent;

    constructor(type, onStarted, onStopped, onEvent, eventBus = null) {
        this.#type = type;
        this.#onStarted = onStarted ?? (() => {});
        this.#onStopped = onStopped ?? (() => {});
        this.#onEvent = onEvent;
        this.#eventBus = eventBus;
    }

    get started() {
        return this.#started;
    }

    get eventBus() {
        return this.#eventBus;
    }

    _emit(content, stringfy = false) {
        if (content && content === this.#lastContent)
            return;

        if (stringfy)
            content = JSON.stringify(content)

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

    static maskInput(value) {
        /** @param {string} value */
        const createRandomString = (value) => {
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            
            return value.split("").map((c) => {
                const ignoreList = [" ", "_", "-", ",", ".", "\"", "'", "(", ")", "[", "]", "{", "}", "´", "`", ";", "/", "\\", "-", "=", "+", "*", "%", "$", "&", "@", "!", "?", "<", ">", "="];
                
                if (ignoreList.includes(c)) {
                    return c;
                } 
                
                return chars.charAt(Math.floor(Math.random() * chars.length));
            }).join("");
        }
        
        return createRandomString(value);
    }

    /**
     * 
     * @param {Element} el
     * @private
     */
    static createXPathFromElement(el) {
        /** @type {string[]} */
        const path = [];
        
        /**  @type {Element} */
        let curr = el;
        
        do {
            let result = curr.localName.toLowerCase();
            
            if (curr.parentElement) {
                const siblings = curr.parentElement.querySelectorAll(':scope > *');
                
                if (siblings && siblings.length > 0) {
                    const sameSiblings = [...siblings].filter(s => s.localName.toLowerCase() === result);
                    const elementIndex = sameSiblings.findIndex(s => s === curr);
                    
                    if (elementIndex === -1) {
                        throw new Error("Element not found in parent node.");
                    }
                    
                    result += `[${elementIndex + 1}]`;
                }
            }
            
            path.unshift(result);
        }
        while ((curr = curr.parentElement));

        return path.length ? "/" + path.join("/") : null;
    }    
    
    static lookupElementByXPath(path, doc = document) { 
        /// https://stackoverflow.com/questions/2661818/javascript-get-xpath-of-a-node
        const evaluator = new XPathEvaluator(); 
        const result = evaluator.evaluate(path, doc.documentElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        return result.singleNodeValue; 
    } 
}