const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public")); // libera áudio

/* ============================= */
/*  MONGO                        */
/* ============================= */

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB conectado"))
.catch(err => console.log("Erro Mongo:", err));

const LogSchema = new mongoose.Schema({
    date: String,
    ip: String,
    name: String
});

const Log = mongoose.model("Log", LogSchema);

/* ============================= */
/*  FORMULÁRIO                   */
/* ============================= */

app.get("/", (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <title>Knight</title>
        <style>
            body {
                margin: 0;
                height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                background: linear-gradient(135deg, #2c2a4a, #5a5473);
                font-family: Arial, sans-serif;
            }

            .card {
                background: #1e1e2f;
                padding: 40px;
                border-radius: 20px;
                text-align: center;
                width: 400px;
                box-shadow: 0 15px 40px rgba(0,0,0,0.5);
                color: white;
            }

            input {
                padding: 12px;
                width: 80%;
                border-radius: 8px;
                border: none;
                margin-top: 15px;
            }

            button {
                margin-top: 15px;
                padding: 10px 20px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                background: #6c63ff;
                color: white;
                font-weight: bold;
            }

            a {
                display: block;
                margin-top: 20px;
                color: #9b7bff;
                text-decoration: none;
            }
        </style>
    </head>
    <body>
        <div class="card">
            <h2>Digite seu nome</h2>
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
/*  SALVAR E MOSTRAR PLAYER      */
/* ============================= */

app.post("/submit", async (req, res) => {

    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const name = req.body.name;

    const newLog = new Log({
        date: new Date().toLocaleString("pt-BR"),
        ip,
        name
    });

    await newLog.save();

    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                margin: 0;
                height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                background: linear-gradient(135deg, #2c2a4a, #5a5473);
                font-family: Arial, sans-serif;
            }

            .card {
                background: #1e1e2f;
                padding: 40px;
                border-radius: 20px;
                text-align: center;
                width: 450px;
                box-shadow: 0 15px 40px rgba(0,0,0,0.5);
                color: white;
            }

            audio {
                margin-top: 20px;
                width: 100%;
            }

            a {
                display: block;
                margin-top: 20px;
                color: #9b7bff;
                text-decoration: none;
            }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>Olá ${name}</h1>

            <audio controls autoplay>
                <source src="/soubonito.mp3" type="audio/mpeg">
            </audio>

            <a href="/">Voltar</a>
        </div>
    </body>
    </html>
    `);
});

/* ============================= */
/*  API                          */
/* ============================= */

app.get("/api/logs", async (req, res) => {
    const logs = await Log.find().sort({ _id: -1 });
    res.json(logs);
});

app.delete("/api/clear", async (req, res) => {
    await Log.deleteMany({});
    res.json({ message: "Logs apagados" });
});

/* ============================= */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor rodando"));