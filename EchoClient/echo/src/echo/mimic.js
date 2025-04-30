import {Handler} from "./handler";
import {EchoTypes} from "./types";

export class EchoMimic
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