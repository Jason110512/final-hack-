document.getElementById("flightForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const icao24 = document.getElementById("icao24").value.trim();
  const start = Math.floor(new Date(document.getElementById("start").value).getTime() / 1000);
  const end = Math.floor(new Date(document.getElementById("end").value).getTime() / 1000);
  const output = document.getElementById("output");

  if (!icao24 || !start || !end) {
    output.textContent = "⚠️ Por favor completa todos los campos.";
    return;
  }

  output.textContent = "⏳ Buscando datos del historial de vuelo...";

  try {
    const url = `https://opensky-network.org/api/flights/aircraft?icao24=${icao24}&begin=${start}&end=${end}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Error al obtener datos de OpenSky");
    }

    const data = await response.json();

    if (data.length === 0) {
      output.textContent = "❌ No se encontraron vuelos en ese periodo.";
      return;
    }

    // Mostrar resultados
    let html = `<table border="1" cellspacing="0" cellpadding="5">
      <tr><th>ICAO24</th><th>Callsign</th><th>Salida</th><th>Llegada</th><th>Duración (min)</th></tr>`;

    data.forEach((flight) => {
      const duracion = ((flight.lastSeen - flight.firstSeen) / 60).toFixed(1);
      html += `<tr>
        <td>${flight.icao24}</td>
        <td>${flight.callsign || "N/A"}</td>
        <td>${new Date(flight.firstSeen * 1000).toUTCString()}</td>
        <td>${new Date(flight.lastSeen * 1000).toUTCString()}</td>
        <td>${duracion}</td>
      </tr>`;
    });

    html += "</table>";
    output.innerHTML = html;
  } catch (err) {
    output.textContent = "🚨 Error: " + err.message;
  }
});
