const express = require("express");
const mongoose = require("mongoose");
const basicAuth = require("basic-auth");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔥 CONECTAR NO MONGODB (COLOQUE SUA STRING AQUI)
mongoose.connect("SUA_STRING_DO_MONGODB", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("MongoDB conectado"))
.catch(err => console.log("Erro Mongo:", err));

// 📦 Schema
const LogSchema = new mongoose.Schema({
    date: String,
    ip: String,
    name: String
});

const Log = mongoose.model("Log", LogSchema);

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Knight Logs</title>
        <link rel="stylesheet" href="/style.css">
    </head>
    <body>
        <div class="container">
            <h2>Digite seu nome para o Knight saber quem é:</h2>
            <form method="POST" action="/submit">
                <input type="text" name="name" placeholder="Seu nome" required />
                <button type="submit">Enviar</button>
            </form>
        </div>
    </body>
    </html>
    `);
});

app.post("/submit", async (req, res) => {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const name = req.body.name;

    const logData = new Log({
        date: new Date().toLocaleString("pt-BR", {
            timeZone: "America/Sao_Paulo"
        }),
        ip: ip,
        name: name
    });

    await logData.save();

    res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Hello</title>
<link rel="stylesheet" href="/style.css">
</head>
<body>
<div class="container">
<h1>Olá ${name}!</h1>

<audio autoplay loop controls>
<source src="/soubonito.mp3" type="audio/mpeg">
</audio>

<br><br>
<a href="/">Voltar</a>
</div>
</body>
</html>
`);
});

// 🔐 Login Basic Auth
function auth(req, res, next) {
    const user = basicAuth(req);
    const USERNAME = "admin";
    const PASSWORD = "12345";

    if (!user || user.name !== USERNAME || user.pass !== PASSWORD) {
        res.set("WWW-Authenticate", 'Basic realm="Logs"');
        return res.status(401).send("Acesso negado");
    }
    next();
}

app.get("/logs", auth, async (req, res) => {
    const logs = await Log.find().sort({ _id: -1 });

    let table = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Logs</title>
        <link rel="stylesheet" href="/style.css">
    </head>
    <body>
        <div class="container">
            <h2>Logs de Acesso</h2>
            <a href="/clear" class="clear-btn">🗑 Limpar Logs</a>
            <table>
                <tr>
                    <th>Data</th>
                    <th>IP</th>
                    <th>Nome</th>
                </tr>
    `;

    logs.forEach(log => {
        table += `
            <tr>
                <td>${log.date}</td>
                <td>${log.ip}</td>
                <td>${log.name}</td>
            </tr>
        `;
    });

    table += `
            </table>
            <br><a href="/">Voltar</a>
        </div>
    </body>
    </html>
    `;

    res.send(table);
});

app.get("/clear", auth, async (req, res) => {
    await Log.deleteMany({});
    res.send("Logs apagados.<br><a href='/logs'>Voltar</a>");
});

app.listen(PORT, () => {
    console.log("Servidor rodando na porta " + PORT);
});
