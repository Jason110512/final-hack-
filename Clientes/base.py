import requests
import psycopg2
import time
from psycopg2 import sql

# --- 1. Configuración de Conexión y Credenciales ---

# Endpoints de la API
API_URL = "https://opensky-network.org/api/states/all"
TOKEN_URL = "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token"

# Credenciales OAuth2 (coloca las tuyas)
CLIENT_ID = "jasonrojasyy@gmail.com-api-client"
CLIENT_SECRET = "sGY7K31OEZ6IGjG12HJokkvk2P2Swahz"
# Credenciales de PostgreSQL
DB_HOST = "localhost"
DB_NAME = "zabbix_registro"
DB_USER = "postgres"
DB_PASS = "123456"

# Tiempo entre peticiones (segundos)
SLEEP_TIME_SECONDS = 3600


# --- 2. Obtener Access Token ---

def get_access_token():
    """Solicita un token de acceso OAuth2 desde OpenSky."""
    data = {
        "grant_type": "client_credentials",
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    try:
        response = requests.post(TOKEN_URL, data=data, headers=headers)
        response.raise_for_status()
        token = response.json()["access_token"]
        print("🔑 Token de acceso obtenido correctamente.")
        return token
    except Exception as e:
        print(f"❌ Error al obtener el token de acceso: {e}")
        print(f"🧾 Respuesta del servidor: {response.status_code} - {response.text}")
        return None


# --- 3. Conexión a la base de datos ---

def setup_database():
    """Conecta a PostgreSQL y crea la tabla si no existe."""
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS
        )
        cursor = conn.cursor()

        create_table_query = """
        CREATE TABLE IF NOT EXISTS state_vectors (
            time_capture BIGINT NOT NULL,
            icao24 TEXT PRIMARY KEY,
            callsign TEXT,
            origin_country TEXT,
            last_contact REAL,
            longitude REAL,
            latitude REAL,
            baro_altitude REAL,
            velocity REAL,
            on_ground BOOLEAN
        );
        """
        cursor.execute(create_table_query)
        conn.commit()
        print("✅ Conexión a PostgreSQL establecida y tabla verificada/creada.")
        return conn

    except psycopg2.Error as e:
        print(f"❌ Error al conectar o configurar PostgreSQL: {e}")
        return None


# --- 4. Insertar o actualizar datos en PostgreSQL ---

def insert_data(conn, data):
    """Inserta o actualiza (UPSERT) los vectores de estado."""
    cursor = conn.cursor()
    states = data.get('states', [])
    time_capture = data.get('time', int(time.time()))

    upsert_sql = """
        INSERT INTO state_vectors (
            time_capture, icao24, callsign, origin_country, last_contact, 
            longitude, latitude, baro_altitude, velocity, on_ground
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        )
        ON CONFLICT (icao24) DO UPDATE SET
            time_capture = EXCLUDED.time_capture,
            callsign = EXCLUDED.callsign,
            origin_country = EXCLUDED.origin_country,
            last_contact = EXCLUDED.last_contact,
            longitude = EXCLUDED.longitude,
            latitude = EXCLUDED.latitude,
            baro_altitude = EXCLUDED.baro_altitude,
            velocity = EXCLUDED.velocity,
            on_ground = EXCLUDED.on_ground;
    """

    records_to_insert = []
    for state in states:
        try:
            values = (
                time_capture,
                state[0],
                state[1].strip() if state[1] else None,
                state[2],
                state[4],
                state[5],
                state[6],
                state[7],
                state[9],
                bool(state[8])
            )
            records_to_insert.append(values)
        except IndexError:
            continue

    if records_to_insert:
        try:
            cursor.executemany(upsert_sql, records_to_insert)
            conn.commit()
            print(f"📊 Insertados/Actualizados {len(records_to_insert)} vectores de estado.")
        except Exception as e:
            print(f"❌ Error al ejecutar UPSERT: {e}")
            conn.rollback()

    cursor.close()


# --- 5. Obtener datos desde OpenSky ---

def fetch_opensky_data(token):
    """Obtiene los vectores de estado en vivo usando el token OAuth2."""
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(API_URL, headers=headers)
        if response.status_code == 401:
            print("⚠️ Token expirado o inválido, solicitando uno nuevo...")
            return None, True
        response.raise_for_status()
        return response.json(), False
    except Exception as e:
        print(f"❌ Error al obtener datos de la API: {e}")
        return None, False


# --- 6. Ejecución principal ---
if __name__ == "__main__":
    db_conn = setup_database()
    token = get_access_token()

    if db_conn and token:
        try:
            while True:
                print("\n--- Obteniendo nuevos datos de OpenSky API ---")
                flight_data, token_expired = fetch_opensky_data(token)

                if token_expired:
                    token = get_access_token()
                    continue

                if flight_data and flight_data.get("states"):
                    insert_data(db_conn, flight_data)
                else:
                    print("⚠️ No se encontraron estados de aeronaves.")

                print(f"💤 Esperando {SLEEP_TIME_SECONDS} segundos antes de la siguiente petición...")
                time.sleep(SLEEP_TIME_SECONDS)

        except KeyboardInterrupt:
            print("\n🛑 Proceso detenido por el usuario.")
        finally:
            if db_conn:
                db_conn.close()
                print("🔒 Conexión a PostgreSQL cerrada.")
