const uuid = require("uuid");
const Message = require("./message.js");
const plugin = require("./plugin.js");
const resources = require("./resources.js");

let providers = {};
module.exports.providers = providers;

class ChatProvider {
    constructor({ name, send_message = null }) {
        if (!name) throw new Error("`name` required");
        if (typeof (send_message) != "function") {
            throw new Error("`send_message` must be a function");
        }
        this.name = name;
        this.send_message = send_message;
    }

    async register() {
        let d = await resources.db.collection("disabled_chat_providers").find({
            name: this.name
        }).limit(1);
        if(d && d.length) {
            return false;
        }
        providers[this.name] = this;
        return true;
    }
}
module.exports.ChatProvider = ChatProvider;

module.exports.dispatch = dispatch;
async function dispatch(msg) {
    if (!(msg instanceof Message)) {
        throw new Error("Invalid message");
    }
    if (msg.to_id) {
        let provider = providers[msg.to_chat_provider];
        if (!provider) {
            throw new Error("Provider not found: " + msg.to_chat_provider);
        }
        await provider.send_message(msg);
    } else if (msg.from_id) {
        let provider = providers[msg.from_chat_provider];
        if (!provider) {
            throw new Error("Provider not found: " + msg.from_chat_provider);
        }
        await handle_incoming_message(msg);
        let p = plugin.run_chain(msg);
        if (!p) { // No plugin can handle this message
            return;
        }
        await p.handle_message(msg);
    } else {
        throw new Error("Neither to_id nor from_id is specified for the message.");
    }
}

async function handle_incoming_message(msg) {
    msg.id = uuid.v4();
    msg.create_time = Date.now();

    if(resources.config.log_messages) {
        await resources.db.collection("messages").insertOne(msg);
    }
}
