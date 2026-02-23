const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

/* ============================= */
/*  MODELO DAS LOGS              */
/* ============================= */

const logSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Log = mongoose.model("Log", logSchema);

/* ============================= */
/*  ROTAS                        */
/* ============================= */

// 🔥 ROTA TESTE (IMPORTANTE PRA VER SE TA ONLINE)
app.get("/", (req, res) => {
    res.send("SERVIDOR ONLINE");
});

// 🔥 BUSCAR LOGS
app.get("/api/logs", async (req, res) => {
    try {
        const logs = await Log.find().sort({ createdAt: -1 });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar logs" });
    }
});

// 🔥 CRIAR LOG
app.post("/api/logs", async (req, res) => {
    try {
        const newLog = new Log({
            name: req.body.name
        });

        await newLog.save();
        res.status(201).json(newLog);
    } catch (error) {
        res.status(400).json({ error: "Erro ao criar log" });
    }
});

// 🔥 APAGAR TODAS LOGS
app.delete("/api/logs", async (req, res) => {
    try {
        await Log.deleteMany({});
        res.json({ message: "Logs apagadas com sucesso" });
    } catch (error) {
        res.status(500).json({ error: "Erro ao apagar logs" });
    }
});

/* ============================= */
/*  CONEXÃO MONGO + START        */
/* ============================= */

mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("MongoDB conectado");

    app.listen(process.env.PORT || 3000, () => {
        console.log("Servidor rodando");
    });
})
.catch(err => {
    console.log("Erro ao conectar no MongoDB:", err);
});
