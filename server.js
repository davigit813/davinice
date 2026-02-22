// Rota de logs protegida
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
    res.send("Logs apagados com sucesso. <br><a href='/logs'>Voltar</a>");
});