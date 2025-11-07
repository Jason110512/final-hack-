document.getElementById('formulario-registro').addEventListener('submit', function(e) {
    e.preventDefault();

    const data = {
        alias: document.getElementById('alias').value,
        password: document.getElementById('password').value,
        name: document.getElementById('name').value,
        surname: document.getElementById('surname').value,
        edad: document.getElementById('edad').value,
        anio: document.getElementById('anio').value,
        usrgrpid: document.getElementById('usrgrpid').value
    };

    const resultadoDiv = document.getElementById('resultado');
    resultadoDiv.style.display = 'block';
    resultadoDiv.textContent = 'Guardando usuario en la base de datos...';

    fetch('/registrar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(res => {
        if (res.mensaje) {
            resultadoDiv.style.backgroundColor = '#d4edda';
            resultadoDiv.style.color = '#155724';
            resultadoDiv.textContent = res.mensaje;
        } else {
            resultadoDiv.style.backgroundColor = '#f8d7da';
            resultadoDiv.style.color = '#721c24';
            resultadoDiv.textContent = '❌ Error: ' + res.error;
        }
    })
    .catch(err => {
        resultadoDiv.style.backgroundColor = '#f8d7da';
        resultadoDiv.style.color = '#721c24';
        resultadoDiv.textContent = '❌ Error de conexión: ' + err;
    });
});
