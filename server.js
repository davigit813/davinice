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
/*  DASHBOARD WEB (CELULAR)      */
/* ============================= */

app.get("/dashboard", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
<title>Davi Dashboard</title>
<style>
body { margin:0; font-family:Arial; background:linear-gradient(135deg,#0f0f1a,#1b1b2f); color:#fff; }
.login { display:flex; height:100vh; justify-content:center; align-items:center; }
.card { background:rgba(255,255,255,0.05); padding:40px; border-radius:20px; width:350px; text-align:center; }
input { padding:12px; width:100%; border-radius:10px; border:none; margin-top:15px; background:#1e1e2f; color:white; }
button { margin-top:15px; padding:10px 20px; border-radius:10px; border:none; cursor:pointer; font-weight:bold; }
.btn1 { background:#00f5a0; }
.btn2 { background:#ff0844; }
.dashboard { padding:30px; display:none; }
table { width:100%; border-collapse:collapse; margin-top:20px; }
th { background:#141427; padding:12px; }
td { padding:12px; background:rgba(255,255,255,0.03); }
</style>
</head>
<body>

<div class="login" id="login">
<div class="card">
<h2>Painel</h2>
<input type="password" id="pass" placeholder="Senha">
<button class="btn1" onclick="login()">Entrar</button>
</div>
</div>

<div class="dashboard" id="dash">
<h2>Logs</h2>
<button class="btn1" onclick="load()">Atualizar</button>
<button class="btn2" onclick="clearLogs()">Limpar</button>

<table id="table">
<tr><th>Data</th><th>IP</th><th>Nome</th></tr>
</table>
</div>

<script>
const PASSWORD = "12345";

function login(){
 if(document.getElementById("pass").value===PASSWORD){
  document.getElementById("login").style.display="none";
  document.getElementById("dash").style.display="block";
  load();
 }else{
  alert("Senha errada");
 }
}

async function load(){
 const res = await fetch("/api/logs");
 const logs = await res.json();
 const table = document.getElementById("table");
 table.innerHTML="<tr><th>Data</th><th>IP</th><th>Nome</th></tr>";
 logs.forEach(log=>{
  table.innerHTML+=\`<tr><td>\${log.date}</td><td>\${log.ip}</td><td>\${log.name}</td></tr>\`;
 });
}

async function clearLogs(){
 await fetch("/api/clear",{method:"DELETE"});
 load();
}
</script>

</body>
</html>
`);
});

/* ============================= */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor rodando"));