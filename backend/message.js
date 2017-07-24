class Message {
    constructor({
        from_id = null,
        from_chat_provider = null,
        to_id = null,
        to_chat_provider = null,
        content = null
    }) {
        this.from_id = from_id;
        this.from_chat_provider = from_chat_provider;
        this.to_id = to_id;
        this.to_chat_provider = to_chat_provider;
    }

    reply(content) {
        if(!this.from_id) {
            throw new Error("from_id not specified");
        }
        return new Message({
            to_id: this.from_id,
            to_chat_provider: this.from_chat_provider,
            content: content
        });
    }
}

module.exports = Message;
