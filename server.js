const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// 🔥 ROTA TESTE
app.get("/", (req, res) => {
    res.send("SERVIDOR ONLINE");
});

// 🔥 ROTA DAS LOGS
app.get("/api/logs", async (req, res) => {
    try {
        const logs = await Log.find().sort({ createdAt: -1 });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: "Erro ao buscar logs" });
    }
});

// MODELO LOG (se não tiver)
const logSchema = new mongoose.Schema({
    name: String,
    createdAt: { type: Date, default: Date.now }
});

const Log = mongoose.model("Log", logSchema);

// CONEXÃO MONGO
mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("Mongo conectado");
    app.listen(process.env.PORT || 3000, () =>
        console.log("Servidor rodando")
    );
})
.catch(err => console.log(err));
