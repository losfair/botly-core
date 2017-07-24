const lib = require("./main.js");
const MongoClient = require("mongodb").MongoClient;

let db;

function sleep(ms) {
    return new Promise(cb => setTimeout(() => cb(), ms));
}

async function run() {
    db = await MongoClient.connect("mongodb://127.0.0.1:27017/botly_test");
    await lib.start({
        mongodb: db,
        listen_addr: "127.0.0.1:4179",
        password_verifier: pw => pw == "test"
        //admin_user_id: "bab309c6-a250-45d3-bdd8-b5b5de48871d"
    });

    let msg_generator = new lib.chat.ChatProvider({
        name: "msggen",
        send_message: msg => console.log(msg)
    });
    let echo_plugin = new lib.plugin.Plugin({
        name: "echo",
        handle_lookup: () => true,
        handle_message: msg => lib.chat.dispatch(msg.reply("[Reply] " + msg.content))
    });

    await msg_generator.register();
    await echo_plugin.register();

    while(true) {
        await sleep(5000);
        try {
            await lib.chat.dispatch(new lib.Message({
                from_id: "test_id",
                from_chat_provider: "msggen",
                content: "Tick"
            }));
        } catch(e) {
            console.log(e);
        }
    }
}

run();
