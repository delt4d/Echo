import {
    PageChangeHandler, 
    InputHandler, 
    MouseMoveHandler, 
    MouseClickHandler, 
    PageResizeHandler, 
    ScrollHandler
} from "./handlers";
import {EchoData} from "./data";

export class EchoRecorder {
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

        const data = new EchoData(type, content, timeElapsed);
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
