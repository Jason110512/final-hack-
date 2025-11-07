const express = require("express");
const app = express();

app.use(express.static(__dirname));

app.listen(3000, () => console.log("✅ Abre en tu navegador: http://localhost:3000/historial.html"));
