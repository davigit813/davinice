const express = require("express");
const fs = require("fs");
const basicAuth = require("basic-auth");

const app = express();
const PORT = process.env.PORT || 3000;

const LOG_FILE = "logs.json";

// Função para salvar log
function saveLog(data) {
    let logs = [];

    if (fs.existsSync(LOG_FILE)) {
        logs = JSON.parse(fs.readFileSync(LOG_FILE));
    }

    logs.push(data);
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}

// Rota principal
app.get("/", (req, res) => {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];

    const logData = {
        date: new Date().toLocaleString(),
        ip: ip,
        userAgent: userAgent
    };

    saveLog(logData);

    res.send("<h1>Hello World</h1>");
});

// Middleware de proteção
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

// Rota de logs
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
            <th>Navegador</th>
        </tr>
    `;

    logs.forEach(log => {
        table += `
            <tr>
                <td>${log.date}</td>
                <td>${log.ip}</td>
                <td>${log.userAgent}</td>
            </tr>
        `;
    });

    table += "</table>";

    res.send(table);
});

// Rota para limpar logs
app.get("/clear", auth, (req, res) => {
    fs.writeFileSync(LOG_FILE, "[]");
    res.send("Logs apagados com sucesso.<br><a href='/logs'>Voltar</a>");
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
