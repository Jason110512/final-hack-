// trafico.js
const map = L.map("map").setView([23.5, -102], 5);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap",
}).addTo(map);

const planesLayer = L.layerGroup().addTo(map);
const rutasLayer = L.layerGroup().addTo(map);

// Guardamos posiciones previas por avión (para dibujar ruta)
const rutas = {};

// === ICONO DE AVIÓN SVG PERSONALIZADO ===
function crearIconoAvion(heading = 0, enTierra = false, velocidad = 0) {
  const color = enTierra ? "#e74c3c" : "#2ecc71";
  const size = Math.min(velocidad / 10 + 20, 40); // escala el tamaño según velocidad

  return L.divIcon({
    html: `
      <div style="transform: rotate(${heading}deg);">
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}">
          <path d="M2.5 19l19.5-7L2.5 5v5l12 2-12 2z"/>
        </svg>
      </div>
    `,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

async function cargarVuelos() {
  try {
    const res = await fetch("/proxy/mexico");
    if (!res.ok) throw new Error("Error HTTP " + res.status);
    const data = await res.json();

    planesLayer.clearLayers();
    rutasLayer.clearLayers();

    let total = 0;
    let enVuelo = 0;
    let enTierra = 0;
    let sumaVel = 0;

    if (data.states) {
      data.states.forEach((s) => {
        const [icao24, callsign, , , , lon, lat, , , , , onGround, velocity, heading] = s;
        if (!lat || !lon) return;

        total++;
        if (onGround) enTierra++;
        else enVuelo++;
        if (velocity) sumaVel += velocity;

        // Guardar ruta previa
        if (!rutas[icao24]) rutas[icao24] = [];
        rutas[icao24].push([lat, lon]);
        if (rutas[icao24].length > 10) rutas[icao24].shift(); // máximo 10 puntos por vuelo

        // Dibujar ruta del vuelo
        const ruta = L.polyline(rutas[icao24], {
          color: "#3498db",
          weight: 2,
          opacity: 0.6,
        }).addTo(rutasLayer);

        // Icono del avión
        const icon = crearIconoAvion(heading, onGround, velocity || 0);

        const marker = L.marker([lat, lon], { icon }).bindPopup(`
          <b>${callsign || "Sin ID"}</b><br>
          ICAO: ${icao24}<br>
          Velocidad: ${(velocity * 3.6).toFixed(1) || 0} km/h<br>
          Rumbo: ${heading?.toFixed(0) || 0}°<br>
          Estado: ${onGround ? "En tierra" : "En vuelo"}
        `);

        planesLayer.addLayer(marker);
      });
    }

    const velProm = total ? (sumaVel / total).toFixed(1) : 0;

    // Panel lateral
    document.getElementById("total").textContent = total;
    document.getElementById("enVuelo").textContent = enVuelo;
    document.getElementById("enTierra").textContent = enTierra;
    document.getElementById("velProm").textContent = velProm;

    console.log(`✈️ ${total} vuelos actualizados (${enVuelo} en vuelo, ${enTierra} en tierra)`);
  } catch (err) {
    console.error("Error cargando vuelos:", err);
  }
}

// Carga inicial + actualización cada hora (3600000 ms)
cargarVuelos();
setInterval(cargarVuelos, 3600000);
