const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/* ============================= */
/*  CONEXÃO MONGO                */
/* ============================= */

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB conectado"))
.catch(err => console.log("Erro Mongo:", err));

/* ============================= */
/*  SCHEMA                       */
/* ============================= */

const LogSchema = new mongoose.Schema({
    date: String,
    ip: String,
    name: String
});

const Log = mongoose.model("Log", LogSchema);

/* ============================= */
/*  SITE COM FORMULÁRIO          */
/* ============================= */

app.get("/", (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <title>Knight Logs</title>
        <style>
            body {
                background: #111;
                color: white;
                font-family: Arial;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
            }
            .box {
                background: #1e1e1e;
                padding: 40px;
                border-radius: 10px;
                text-align: center;
            }
            input {
                padding: 10px;
                width: 200px;
                border: none;
                border-radius: 5px;
            }
            button {
                padding: 10px 20px;
                margin-top: 10px;
                border: none;
                background: #00ff88;
                color: black;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="box">
            <h2>Digite seu nome:</h2>
            <form method="POST" action="/submit">
                <input type="text" name="name" required />
                <br>
                <button type="submit">Enviar</button>
            </form>
        </div>
    </body>
    </html>
    `);
});

/* ============================= */
/*  SALVAR LOG                   */
/* ============================= */

app.post("/submit", async (req, res) => {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const name = req.body.name;

    const newLog = new Log({
        date: new Date().toLocaleString("pt-BR", {
            timeZone: "America/Sao_Paulo"
        }),
        ip: ip,
        name: name
    });

    await newLog.save();

    res.send(`
        <h1>Olá ${name}!</h1>
        <a href="/">Voltar</a>
    `);
});

/* ============================= */
/*  API PARA APP                 */
/* ============================= */

app.get("/api/logs", async (req, res) => {
    try {
        const logs = await Log.find().sort({ _id: -1 });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: "Erro ao buscar logs" });
    }
});

app.delete("/api/clear", async (req, res) => {
    try {
        await Log.deleteMany({});
        res.json({ message: "Logs apagados com sucesso" });
    } catch (err) {
        res.status(500).json({ error: "Erro ao apagar logs" });
    }
});

/* ============================= */
/*  START                        */
/* ============================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Servidor rodando na porta " + PORT);
});