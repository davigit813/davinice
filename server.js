const express = require("express");
const mongoose = require("mongoose");
const basicAuth = require("basic-auth");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔥 CONECTAR NO MONGODB
mongoose.connect(process.env.MONGO_URI)
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
app.use(express.json()); // necessário para DELETE API
app.use(express.static("public"));

/* ===============================
   PÁGINA PRINCIPAL
================================ */

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
            <h2>Digite seu nome:</h2>
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
        ip,
        name
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

/* ===============================
   AUTH
================================ */

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

/* ===============================
   PÁGINA HTML PROTEGIDA
================================ */

app.get("/logs", auth, async (req, res) => {
    const logs = await Log.find().sort({ _id: -1 });

    let table = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <title>Logs</title>
    </head>
    <body>
        <h2>Logs</h2>
        <a href="/clear">🗑 Limpar Logs</a>
        <table border="1">
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
    </body>
    </html>
    `;

    res.send(table);
});

/* ===============================
   LIMPAR LOGS (SITE)
================================ */

app.get("/clear", auth, async (req, res) => {
    await Log.deleteMany({});
    res.send("Logs apagados.<br><a href='/logs'>Voltar</a>");
});

/* ===============================
   API PARA APP DESKTOP
================================ */

// 🔎 Buscar logs
app.get("/api/logs", async (req, res) => {
    try {
        const logs = await Log.find().sort({ _id: -1 });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: "Erro ao buscar logs" });
    }
});

// 🧹 Apagar logs via API
app.delete("/api/clear", async (req, res) => {
    try {
        await Log.deleteMany({});
        res.json({ message: "Logs apagados" });
    } catch (err) {
        res.status(500).json({ error: "Erro ao apagar logs" });
    }
});

/* ===============================
   START
================================ */

app.listen(PORT, () => {
    console.log("Servidor rodando na porta " + PORT);
});
