const Message = require("./message.js");
const plugin = require("./plugin.js");

let providers = {};

class ChatProvider {
    constructor({ name, send_message = null }) {
        if (!name) throw new Error("`name` required");
        if (typeof (send_message) != "function") {
            throw new Error("`send_message` must be a function");
        }
        this.name = name;
        this.send_message = send_message;
    }

    register() {
        providers[this.name] = this;
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
            throw new Error("Provider not found");
        }
        await provider.send_message(msg);
    } else if (msg.from_id) {
        let provider = providers[msg.from_chat_provider];
        if (!provider) {
            throw new Error("Provider not found");
        }
        let p = plugin.run_chain(msg);
        if (!p) { // No plugin can handle this message
            return;
        }
        await p.handle_message(msg);
    } else {
        throw new Error("Neither to_id nor from_id is specified for the message.");
    }
}
