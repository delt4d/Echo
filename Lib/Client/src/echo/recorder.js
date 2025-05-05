import {
    PageChangeHandler, 
    InputHandler, 
    MouseMoveHandler, 
    MouseClickHandler, 
    PageResizeHandler, 
    ScrollHandler
} from "./handlers";
import {EchoData} from "./data";
import {EchoEventBus} from "./event-bus.js";

export class EchoRecorder {
    #lastTime;
    #eventsQueue = [];
    #handlers = [];
    #canceled = false;
    #eventBus;
    #tickMs;

    /**
     * 
     * @param {object} opt 
     * @param {boolean} opt.useDefaultHandlers
     * @param {number} opt.tickMs
     */
    constructor(opt) {
        opt = opt || {};
        opt.useDefaultHandlers = opt.useDefaultHandlers !== false;

        this.#tickMs = opt.tickMs || 1000;
        this.#lastTime = Date.now();
        this.#eventBus = new EchoEventBus();

        if (opt.useDefaultHandlers) {
            this.addHandler(PageChangeHandler)
                .addHandler(InputHandler)   
                .addHandler(MouseMoveHandler)   
                .addHandler(MouseClickHandler)  
                .addHandler(PageResizeHandler)  
                .addHandler(ScrollHandler);
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
        const handler = new HandlerCls(this.#eventBus);

        this.#handlers.push(handler);

        if (!this.#canceled) {
            handler.setOnEvent(onEvent);
            handler.start();
        }
        
        return this;
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
