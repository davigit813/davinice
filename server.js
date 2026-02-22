const express = require("express");
const fs = require("fs");
const basicAuth = require("basic-auth");

const app = express();
const PORT = process.env.PORT || 3000;

const LOG_FILE = "logs.json";

app.use(express.urlencoded({ extended: true }));

// Função para salvar log
function saveLog(data) {
    let logs = [];

    if (fs.existsSync(LOG_FILE)) {
        logs = JSON.parse(fs.readFileSync(LOG_FILE));
    }

    logs.push(data);
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}

// 🔹 Página inicial com formulário
app.get("/", (req, res) => {
    res.send(`
        <h2>Digite seu nome para o Knight saber quem é:</h2>
        <form method="POST" action="/submit">
            <input type="text" name="name" required />
            <button type="submit">Enviar</button>
        </form>
    `);
});

// 🔹 Recebe o nome e salva log
app.post("/submit", (req, res) => {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const name = req.body.name;

    const logData = {
        date: new Date().toLocaleString(),
        ip: ip,
        name: name
    };

    saveLog(logData);

    res.send("<h1>Hello World</h1>");
});

// 🔐 Middleware de proteção
function auth(req, res, next) {
    const user = basicAuth(req);

    const USERNAME = "admin";
    const PASSWORD = "1234";

    if (!user || user.name !== USERNAME || user.pass !== PASSWORD) {
        res.set("WWW-Authenticate", 'Basic realm="Logs"');
        return res.status(401).send("Acesso negado");
    }

    next();
}

// 📊 Rota de logs
app.get("/logs", auth, (req, res) => {
    if (!fs.existsSync(LOG_FILE)) {
        return res.send("Sem logs ainda.");
    }

    const logs = JSON.parse(fs.readFileSync(LOG_FILE));

    let table = `
        <h2>Logs de Acesso</h2>
        <a href="/clear" style="color:red;">🗑 Limpar Logs</a>
        <br><br>
        <table border="1" cellpadding="5">
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

    table += "</table>";

    res.send(table);
});

// 🗑 Limpar logs
app.get("/clear", auth, (req, res) => {
    fs.writeFileSync(LOG_FILE, "[]");
    res.send("Logs apagados.<br><a href='/logs'>Voltar</a>");
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
