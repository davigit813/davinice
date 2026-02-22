const express = require("express");
const fs = require("fs");
const basicAuth = require("basic-auth");

const app = express();
const PORT = process.env.PORT || 3000;
const LOG_FILE = "logs.json";

// Middleware para pegar dados do formulário
app.use(express.urlencoded({ extended: true }));

// Middleware para servir arquivos estáticos (CSS, áudio, etc.)
app.use(express.static("public"));

// Função para salvar logs
function saveLog(data) {
    let logs = [];
    if (fs.existsSync(LOG_FILE)) {
        logs = JSON.parse(fs.readFileSync(LOG_FILE));
    }
    logs.push(data);
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}

// 🔹 Página inicial estilizada
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

// 🔹 Receber o nome e salvar log
app.post("/submit", (req, res) => {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const name = req.body.name;

    const logData = {
        date: new Date().toLocaleString(),
        ip: ip,
        name: name
    };

    saveLog(logData);

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
            <audio autoplay muted loop controls>
                <source src="music/SaveTik.io_7472943081663253765.mp3" type="audio/mpeg">
            </audio>
            <a href="/">Voltar</a>
        </div>
    </body>
    </html>
    `);
});

// 🔐 Middleware de proteção básica
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

// 📊 Rota de logs estilizada
app.get("/logs", auth, (req, res) => {
    if (!fs.existsSync(LOG_FILE)) return res.send("Sem logs ainda.");

    const logs = JSON.parse(fs.readFileSync(LOG_FILE));
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

// 🗑 Limpar logs
app.get("/clear", auth, (req, res) => {
    fs.writeFileSync(LOG_FILE, "[]");
    res.send("Logs apagados.<br><a href='/logs'>Voltar</a>");
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
