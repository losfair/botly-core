const fs = require("fs");
const path = require("path");
const ice = require("ice-node");
const rp = require("request-promise");
const chat = require("./chat.js");
const plugin = require("./plugin.js");
const resources = require("./resources.js");
const Message = require("./message.js");

module.exports.chat = chat;
module.exports.plugin = plugin;
module.exports.Message = Message;

const app = new ice.Ice();

function add_template(name) {
    app.add_template(name, fs.readFileSync(path.join(__dirname, "../templates/" + name), "utf-8"));
}

function add_templates(names) {
    for(const name of names) {
        add_template(name);
    }
}

function is_logged_in(req) {
    return !!req.session.login_time;
}


// TODO: Implement this in Ice-node
function redirect(target) {
    return new ice.Response({
        status: 302,
        headers: {
            Location: target
        },
        body: "Redirecting"
    });
}

function require_login(req) {
    if(!is_logged_in(req)) {
        throw redirect("/login");
    }
}

function init_password_verification(verifier) {
    if(typeof(verifier) != "function") {
        throw new Error("Verifier must be a function");
    }

    app.get("/login", req => new ice.Response({
        template_name: "login_password.html",
        template_params: {}
    }));
    app.use("/login_verify", new ice.Flag("init_session"));

    // FIXME: Session cookie path
    app.post("/login_verify", async req => {
        let pw = req.form().password;
        let redirect_target = "/";

        if(await verifier(pw)) {
            req.session.login_time = Date.now().toString();
        } else {
            redirect_target = "/login";
        }

        return redirect(redirect_target);
    });
}

function init_oneidentity_verification(admin_user_id) {
    if(!admin_user_id) {
        throw new Error("admin_user_id required");
    }

    app.get("/login", req => new ice.Response({
        template_name: "login_oneidentity.html",
        template_params: {}
    }));
    app.use("/login_verify", new ice.Flag("init_session"));

    // FIXME: Session cookie path
    app.get("/login_verify", async req => {
        // TODO: Implement query string parsing in Ice-node
        let ct = req.uri.split("?")[1].split("client_token=")[1].split("&")[0];

        let result = await rp.post("https://oneidentity.me/identity/verify/verify_client_token", {
            form: {
                client_token: ct
            }
        });
        result = JSON.parse(result);

        let redirect_target = "/";

        if(result.userId && result.userId == admin_user_id) {
            req.session.login_time = Date.now().toString();
        } else {
            redirect_target = "/login";
        }

        return redirect(redirect_target);
    });
}

add_templates([
    "base.html",
    "login_oneidentity.html",
    "login_password.html",
    "admin.html"
]);


// No caching etc. Use a reverse proxy in production.
app.use("/static/", ice.static(path.join(__dirname, "../static")));

app.use("/admin/", new ice.Flag("init_session"));
app.use("/admin/", require_login);

app.get("/", req => redirect("/admin/index"));
app.get("/admin/", req => redirect("/admin/index"));

app.get("/admin/index", req => new ice.Response({
    template_name: "admin.html",
    template_params: {}
}));

module.exports.start = start;
async function start({
    listen_addr = null,
    password_verifier = null,
    admin_user_id = null,
    mongodb = null
}) {
    if(!mongodb) throw new Error("mongodb instance required");
    resources.db = mongodb;

    if(password_verifier) {
        init_password_verification(password_verifier);
    } else if(admin_user_id) {
        init_oneidentity_verification(admin_user_id);
    } else {
        throw new Error("No available verification method");
    }

    app.listen(listen_addr);
}
