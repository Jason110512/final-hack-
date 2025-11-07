from flask import Flask, request, jsonify, render_template, session, redirect, url_for
from flask_cors import CORS
import psycopg2

app = Flask(__name__)
app.secret_key = 'supersecretkey123'  # Necesario para session
CORS(app)

# Configuración de la base de datos
DB_CONFIG = {
    'host': 'localhost',
    'database': 'zabbix_registro',
    'user': 'postgres',
    'password': '123456'
}

# Página de registro inicial
@app.route('/')
def index():
    return render_template('registro.html')

# Registrar usuario
@app.route('/registrar', methods=['POST'])
def registrar_usuario():
    data = request.get_json()
    alias = data.get('alias')
    password = data.get('password')
    name = data.get('name')
    surname = data.get('surname')
    edad = data.get('edad')
    anio = data.get('anio')
    usrgrpid = data.get('usrgrpid')

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS usuarios_zabbix (
                id SERIAL PRIMARY KEY,
                alias VARCHAR(50),
                password VARCHAR(100),
                name VARCHAR(100),
                surname VARCHAR(100),
                edad INT,
                anio INT,
                usrgrpid VARCHAR(10)
            );
        """)
        cur.execute("""
            INSERT INTO usuarios_zabbix (alias, password, name, surname, edad, anio, usrgrpid)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (alias, password, name, surname, edad, anio, usrgrpid))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'mensaje': '✅ Usuario guardado correctamente en PostgreSQL.'})
    except Exception as e:
        return jsonify({'error': str(e)})

# Página de login
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        return render_template('login.html')
    
    # POST: procesar login
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        cur.execute("SELECT * FROM usuarios_zabbix WHERE alias = %s AND password = %s", (username, password))
        user = cur.fetchone()
        cur.close()
        conn.close()

        if user:
            session['user'] = username  # Guardamos usuario en session
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'error': 'Usuario o contraseña incorrectos'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

# Página de inicio después del login
@app.route('/inicio')
def inicio():
    if 'user' in session:
        return render_template('inicio.html', user=session['user'])
    else:
        return redirect(url_for('login'))

# Página de vuelos activos
@app.route('/activos')
def activos():
    if 'user' in session:
        return render_template('activos.html')
    else:
        return redirect(url_for('login'))

# Cerrar sesión
@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('login'))

@app.route('/estadisticas')
def estadisticas():
    if 'user' in session:
        return render_template('estadisticas.html')
    else:
        return redirect(url_for('login'))
@app.route('/historial')
def historial():
    if 'user' in session:
        return render_template('historial.html')
    else:
        return redirect(url_for('login'))
    # Página de tráfico aéreo global
@app.route('/trafico')
def trafico():
    if 'user' in session:
        return render_template('trafico.html')
    else:
        return redirect(url_for('login'))

if __name__ == '__main__':
    app.run(debug=True)
