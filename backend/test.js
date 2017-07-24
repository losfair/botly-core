const lib = require("./main.js");
const MongoClient = require("mongodb").MongoClient;

let db;

async function run() {
    db = await MongoClient.connect("mongodb://127.0.0.1:27017/botly_test");
    lib.run({
        mongodb: db,
        listen_addr: "127.0.0.1:4179",
        password_verifier: pw => pw == "test_password"
        //admin_user_id: "bab309c6-a250-45d3-bdd8-b5b5de48871d"
    });
}

run();
