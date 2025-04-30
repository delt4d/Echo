export class Handler {
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

    static _maskInput(value) {
        const createRandomString = (length) => {
            const chars = "_ ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            let result = "";
            for (let i = 0; i < length; i++) {
              result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
          }
        
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