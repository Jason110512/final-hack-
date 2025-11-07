document.getElementById("statsForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const icao24 = document.getElementById("icao24").value.trim();
  const start = Math.floor(new Date(document.getElementById("start").value).getTime() / 1000);
  const end = Math.floor(new Date(document.getElementById("end").value).getTime() / 1000);
  const messageDiv = document.getElementById("message");

  if (!icao24 || !start || !end) {
    messageDiv.textContent = "⚠️ Por favor completa todos los campos.";
    return;
  }

  messageDiv.textContent = "⏳ Consultando historial de vuelos...";

  try {
    const url = `https://opensky-network.org/api/flights/aircraft?icao24=${icao24}&begin=${start}&end=${end}`;
    const response = await fetch(url);

    if (!response.ok) throw new Error("Error al obtener datos del API.");

    const data = await response.json();

    if (data.length === 0) {
      messageDiv.textContent = "❌ No se encontraron vuelos en ese periodo.";
      document.getElementById("flightCount").textContent = "---";
      document.getElementById("averageDuration").textContent = "---";
      document.getElementById("minDuration").textContent = "---";
      document.getElementById("maxDuration").textContent = "---";
      return;
    }

    // Calcular estadísticas de duración
    const durations = data.map(f => (f.lastSeen - f.firstSeen) / 60);
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);

    // Mostrar resultados
    document.getElementById("flightCount").textContent = durations.length;
    document.getElementById("averageDuration").textContent = avg.toFixed(2);
    document.getElementById("minDuration").textContent = min.toFixed(2);
    document.getElementById("maxDuration").textContent = max.toFixed(2);

    messageDiv.textContent = `✅ Se analizaron ${durations.length} vuelos correctamente.`;
    messageDiv.style.color = "green";

  } catch (error) {
    messageDiv.textContent = "🚨 Error: " + error.message;
    messageDiv.style.color = "red";
  }
});
