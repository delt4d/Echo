import {Handler} from "./handler";
import {EchoTypes} from "./types";

class EchoMimicComponent extends HTMLElement {
    constructor() {
        super();
    }
    
    resize(width, height) {
        this.style.width = `${width}px`;
        this.style.height = `${height}px`;
        this.style.minWidth = `${width}px`;
        this.style.minHeight = `${height}px`;
        this.style.maxWidth = `${width}px`;
        this.style.maxHeight = `${height}px`;
    }
    
    moveCursor(posX, posY) {
        const cursor = this.shadowRoot.querySelector(".cursor");
        cursor.style.left = `${posX}px`;
        cursor.style.top = `${posY}px`;
        cursor.style.display = "initial";
    }
    
    cursorDown() {
        const cursor = this.shadowRoot.querySelector(".cursor");
        cursor.classList.add("down");
    }
    
    cursorUp() {
        const cursor = this.shadowRoot.querySelector(".cursor");
        cursor.classList.remove("down");
    }
    
    get #iframeComponentWindow() {
        const iframe = this.shadowRoot.querySelector("iframe");
        return iframe.contentWindow;
    }
    
    get #iframeComponentDocument() {
        const iframe = this.shadowRoot.querySelector("iframe");
        return iframe.contentDocument || iframe.document;
    }

    lookupElementByXPath(xpath) {
        return Handler.lookupElementByXPath(xpath, this.#iframeComponentDocument);
    }

    /**
     * 
     * @param {number} scrollX
     * @param {number} scrollY
     */
    scrollTo(scrollX, scrollY) {
        this.#iframeComponentWindow.scrollTo(scrollX, scrollY);
    }
    
    updateContent(content) {
        const policy = trustedTypes.createPolicy('echo', {
            createHTML: (input) => input
        });
        
        const html = policy.createHTML(content);
        
        this.#iframeComponentDocument.open();
        this.#iframeComponentDocument.writeln(html);
        this.#iframeComponentDocument.close();
    }
    
    zoom(newZoom) {
        if (newZoom) 
            this.style.zoom = newZoom + "%";
        return parseInt(this.style.zoom);
    }

    connectedCallback() {
        const headerTemplate = document.createElement("template");
        headerTemplate.innerHTML = `
        <header>
            <style>
                * {
                    box-sizing: border-box;
                    padding: 0;
                    margin: 0;
                }
            
                main {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                }
                
                iframe {
                    border: none; 
                    width: 100%;
                    height: 100%;
                }
                
                .cursor {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 12px;
                    height: 12px;
                    background: red;
                    border-radius: 50%;
                    z-index: 9999;
                    display: none;
                    transition: top 0.05s linear, left 0.05s linear;
                    transform: translate(-50%, -50%);
                }
                
                .cursor.down {
                    background: blue;
                }
            </style>
        </header>`;
        
        const mainTemplate = document.createElement("template");
        mainTemplate.innerHTML = `
            <main>
                <iframe title="echo-mimic"></iframe>
                <div class="cursor"></div>
            </main>`;

        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(headerTemplate.content);
        shadowRoot.appendChild(mainTemplate.content);
        
        this.style.display = "inline-block";
    }
}

customElements.define("echo-mimic", EchoMimicComponent);

export class EchoMimic
{
    /** @type {EchoData[]} */
    #queue = [];

    /** @type {boolean} */
    #processing = false;
    
    /**
     * @type {EchoMimicComponent}
     */
    #echoComponent;
    
    /**
     * 
     * @param {EchoMimicComponent} echoComponent
     */
    constructor(echoComponent) {
        this.#echoComponent = echoComponent;
    }

    static waitAsync(time) {
        return new Promise(r => setTimeout(r, time));
    }

    /**
     * Enqueue an EchoData instance to be executed in order.
     * @param {EchoData} echoData
     */
    async enqueueAsync(echoData) {
        this.#queue.push(echoData);
        
        if (!this.#processing) {
            await this.#processQueue();
        }
    }

    async #processQueue() {
        this.#processing = true;

        while (this.#queue.length > 0) {
            const next = this.#queue.shift();
            await this.executeAsync(next);
        }

        this.#processing = false;
    }

    /**
     * 
     * @param {EchoData} echoData
     * @returns {Promise<void>}
     */
    async executeAsync(echoData) {
        // wait to execute
        await EchoMimic.waitAsync(echoData.timeElapsed);

        switch(echoData.type) {
            case EchoTypes.pageChanges: {
                this.#echoComponent.updateContent(echoData.content);
                break;
            }

            case EchoTypes.input: {
                const { xpath, value } = JSON.parse(echoData.content);
                const el = this.#echoComponent.lookupElementByXPath(xpath);
                if (el) el.value = value;
                break;
            }
            
            case EchoTypes.mouseUp: {
                this.#echoComponent.cursorUp();
                break;
            }

            case EchoTypes.mouseDown: {
                this.#echoComponent.cursorDown();
                break;
            }

            case EchoTypes.mouseMove: {
                const { clientX, clientY } = JSON.parse(echoData.content);
                this.#echoComponent.moveCursor(clientX, clientY);
                break;
            }

            case EchoTypes.pageResize: {
                const { width, height } = JSON.parse(echoData.content);
                this.#echoComponent.resize(width, height);
                break;
            }

            case EchoTypes.scroll: {
                const { scrollX, scrollY } = JSON.parse(echoData.content);
                this.#echoComponent.scrollTo(scrollX, scrollY);
                break;
            }
        }
    }
}