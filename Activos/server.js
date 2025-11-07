const express = require("express");
const fetch = require("node-fetch");
const app = express();

app.use(express.static(__dirname));

// Endpoint proxy para evitar CORS
app.get("/api/vuelos", async (req, res) => {
  try {
    const response = await fetch("https://opensky-network.org/api/states/all");
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener datos de OpenSky" });
  }
});

app.listen(3000, () => {
  console.log("✅ Servidor corriendo en http://localhost:3000/activos.html");
});
