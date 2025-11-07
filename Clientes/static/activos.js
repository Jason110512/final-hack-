document.getElementById("loadFlights").addEventListener("click", async () => {
  const output = document.getElementById("output");
  output.textContent = " Cargando vuelos activos...";

  try {
    // Llamada al backend local que hace de proxy
    const response = await fetch("/api/vuelos");

    if (!response.ok) throw new Error("Error al obtener datos del servidor");

    const data = await response.json();

    if (!data.states || data.states.length === 0) {
      output.textContent = "No hay vuelos activos en este momento.";
      return;
    }

    let html = `<p>✈️ Vuelos activos totales: <strong>${data.states.length}</strong></p>`;
    html += `<table>
      <tr>
        <th>ICAO24</th>
        <th>Callsign</th>
        <th>País</th>
        <th>Altitud (m)</th>
        <th>Velocidad (m/s)</th>
        <th>Latitud</th>
        <th>Longitud</th>
      </tr>`;

    // Mostrar los primeros 50 vuelos
    data.states.slice(0, 50).forEach(flight => {
      html += `<tr>
        <td>${flight[0]}</td>
        <td>${flight[1] || "N/A"}</td>
        <td>${flight[2]}</td>
        <td>${flight[13] ? flight[13].toFixed(0) : "N/A"}</td>
        <td>${flight[9] ? flight[9].toFixed(1) : "N/A"}</td>
        <td>${flight[6] ? flight[6].toFixed(3) : "N/A"}</td>
        <td>${flight[5] ? flight[5].toFixed(3) : "N/A"}</td>
      </tr>`;
    });

    html += "</table>";
    output.innerHTML = html;

  } catch (error) {
    output.textContent = "🚨 Error: " + error.message;
  }
});
``
