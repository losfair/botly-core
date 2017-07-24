let plugins = [];

module.exports.run_chain = run_chain;
function run_chain(msg) {
    for (let p of plugins) {
        if (p.handle_lookup(msg)) {
            return p;
        }
    }
    return null;
}

class Plugin {
    constructor({ name, handle_lookup = null, handle_message = null }) {
        if (!name) throw new Error("`name` required");
        if (typeof (handle_lookup) != "function") {
            throw new Error("`handle_lookup` must be a function");
        }
        if (typeof (handle_message) != "function") {
            throw new Error("`handle_message` must be a function");
        }

        this.name = name;
        this.handle_lookup = handle_lookup;
        this.handle_message = handle_message;
    }

    register() {
        plugins[this.name] = this;
    }
}

module.exports.Plugin = Plugin;
