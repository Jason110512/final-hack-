// server.js
const express = require("express");
const bodyParser = require("body-parser");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(bodyParser.json());
app.use(express.static(__dirname)); // sirve trafico.html y trafico.js

// === CREDENCIALES ===
const CLIENT_ID = "jasonrojasyy@gmail.com-api-client";
const CLIENT_SECRET = "A6cUyjs4JUtu62zWhVmZ3mhPmoULdAlL";
const TOKEN_URL =
  "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";

let tokenCache = null;
let tokenExpiry = 0;

async function getToken() {
  const now = Date.now();
  if (tokenCache && now < tokenExpiry) return tokenCache;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  const data = await res.json();
  if (!data.access_token) throw new Error("No se pudo obtener token");
  tokenCache = data.access_token;
  tokenExpiry = now + data.expires_in * 1000 - 60000;
  return tokenCache;
}

// === PROXY PARA ÁREA DE MÉXICO ===
app.get("/proxy/mexico", async (req, res) => {
  try {
    const token = await getToken();
    const lamin = 14.5; // sur
    const lamax = 33.0; // norte
    const lomin = -118.0; // oeste
    const lomax = -86.0; // este

    const url = `https://opensky-network.org/api/states/all?lamin=${lamin}&lamax=${lamax}&lomin=${lomin}&lomax=${lomax}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await response.json();
    res.json(json);
  } catch (err) {
    console.error("Error proxy México:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () =>
  console.log("✅ Servidor activo en http://localhost:3000/trafico.html")
);
