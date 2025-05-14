from flask import Flask, jsonify, request
import sqlite3
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

DB_PATH = ("ai-hackathon.db")

def init_db():
    print(f"Initializing database at {DB_PATH}")
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        # building Table
        c.execute('''
            CREATE TABLE IF NOT EXISTS building (
                "id"	INTEGER NOT NULL,
                "name"	TEXT NOT NULL,
                "description"	TEXT NOT NULL,
                "path" TEXT NOT NULL,
                PRIMARY KEY("id" AUTOINCREMENT)
            )
        ''')
        
        # room Table
        c.execute('''
            CREATE TABLE IF NOT EXISTS room (
                "id"	INTEGER NOT NULL,
                "name"	TEXT NOT NULL,
                "live_camera"	TEXT NOT NULL,
                "building_id"	INTEGER NOT NULL,
                PRIMARY KEY("id" AUTOINCREMENT),
                FOREIGN KEY("building_id") REFERENCES "building"("id")
            )
        ''')
        
        #device Table
        c.execute('''
            CREATE TABLE IF NOT EXISTS "device" (
                "id"	INTEGER NOT NULL,
                "hardware_id"	INTEGER NOT NULL,
                "name"	TEXT NOT NULL,
                "is_enabled"	BOOLEAN NOT NULL,
                "persons_before_enabled"	INTEGER NOT NULL,
                "delay_before_enabled"	INTEGER NOT NULL,
                "persons_before_disabled"	INTEGER NOT NULL,
                "delay_before_disabled"	INTEGER NOT NULL,
                "room_id"	INTEGER NOT NULL,
                PRIMARY KEY("id" AUTOINCREMENT),
                FOREIGN KEY("room_id") REFERENCES "room"("id")
            )
        ''')

        conn.commit()
        print(f"Database initialized successfully. Connected using {DB_PATH}")

init_db()

# building TABLE
def get_buildings():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT name, description, path FROM building") 
    building = cursor.fetchall()
    conn.close()
    # Return the description field as the 'path' field for React
    return [{"name": name, 'description':description, 'path': path} for name, description, path in building]

print(get_buildings())

# FETCH FROM building TABLE
@app.route("/api/buildings", methods=["GET"])
def buildings():
    return jsonify(get_buildings())

# room TABLE
@app.route("/api/rooms/<building_name>", methods=["GET"])
def get_room(building_name):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Get the building ID using the building name
    cursor.execute("SELECT id FROM building WHERE name = ?", (building_name,))
    building_id = cursor.fetchone()

    if not building_id:
        conn.close()
        return jsonify({"error": "Building not found"}), 404

    # Fetch rooms belonging to the specific building
    cursor.execute("SELECT name FROM room WHERE building_id = ?", (building_id[0],))
    rooms = cursor.fetchall()
    conn.close()

    # Convert the result to JSON format
    return jsonify([{"name": name} for name in rooms]) 

#add room Table
@app.route("/api/rooms/<building_name>", methods=["POST"])
def add_room(building_name):
    data = request.get_json()
    name = data.get("name", "").strip()
    live_camera = data.get("live_camera", "").strip()

    # Validate inputs
    if not name:
        return jsonify({"error": "Room name cannot be empty"}), 400
    if not live_camera:
        return jsonify({"error": "Live camera URL/IP cannot be empty"}), 400

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Lookup building ID
        cursor.execute("SELECT id FROM building WHERE name = ?", (building_name,))
        b = cursor.fetchone()
        if not b:
            return jsonify({"error": f"Building '{building_name}' not found"}), 404
        building_id = b[0]

        # Insert new room
        cursor.execute(
            "INSERT INTO room (name, live_camera, building_id) VALUES (?, ?, ?)",
            (name, live_camera, building_id)
        )
        conn.commit()

        return jsonify({
            "message": "Room added successfully",
            "room": {"name": name, "live_camera": live_camera}
        }), 201

    except sqlite3.IntegrityError:
        return jsonify({"error": "That room already exists"}), 409

    except Exception as e:
        return jsonify({"error": f"Server error: {e}"}), 500

    finally:
        conn.close()

#fetch device from room
@app.route("/api/devices", methods=["GET"])
def get_all_devices():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Select all devices without using table aliases
        cursor.execute("""
            SELECT id, name, is_enabled, hardware_id, room_id
            FROM device
            ORDER BY name
        """)
        rows = cursor.fetchall()  # Change this to fetchall()

        if not rows:
            return jsonify({"error": "No devices found"}), 404

        devices = []
        for id, name, is_enabled, hw_id, room_id in rows:
            devices.append({
                "id":id,
                "name": name,
                "online": bool(is_enabled),
                "hardware_id": hw_id,
                "room": room_id
            })

        return jsonify(devices)

    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return jsonify({"error": "Database query failed"}), 500
    finally:
        conn.close()


@app.route("/api/devices", methods=["POST"])
def add_device():
    device_data = request.get_json()
    print(f"Received data: {device_data}")

    name = device_data.get('name')
    room = device_data.get('room')  # Use the room name directly
    hardware_id = device_data.get('hardware_id')
    online = device_data.get('online')  # This maps to `is_enabled`

    # Validate required fields
    if not name or not room or hardware_id is None:
        return jsonify({"error": "Missing required fields"}), 400

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Insert device into the database without looking up room ID
        cursor.execute("""
                        INSERT INTO device (name, is_enabled, hardware_id, room_id, 
                        persons_before_enabled, delay_before_enabled, 
                        persons_before_disabled, delay_before_disabled)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, ((name, online, hardware_id, room, 0, 0, 0, 0)))

        conn.commit()
        conn.close()

        return jsonify({"message": "Device added successfully!"}), 201
    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return jsonify({"error": "Database query failed"}), 500


if __name__ == '__main__':
    app.run(debug=True)