export class EchoData
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
}