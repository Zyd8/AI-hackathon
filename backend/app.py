from flask import Flask, request, render_template, redirect, url_for
import sqlite3
import os

app = Flask(__name__)

# Initialize database
def init_db():
    with sqlite3.connect(r'ai-hackathon.db') as conn:
        cursor = conn.cursor()
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS building (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT NOT NULL
        )
        ''')
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS room (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            live_camera TEXT NOT NULL,
            building_id INTEGER NOT NULL,
            FOREIGN KEY(building_id) REFERENCES building(id)
        )
        ''')
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS device (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hardware_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            is_enabled BOOLEAN NOT NULL,
            persons_before_enabled INTEGER NOT NULL,
            delay_before_enabled INTEGER NOT NULL,
            persons_before_disabled INTEGER NOT NULL,
            delay_before_disabled INTEGER NOT NULL,
            room_id INTEGER NOT NULL,
            FOREIGN KEY(room_id) REFERENCES room(id)
        )
        ''')
        conn.commit()

# Add Building
@app.route('/add_building', methods=['POST'])
def add_building():
    name = request.form['name']
    description = request.form['description']
    with sqlite3.connect(r'ai-hackathon.db') as conn:
        cursor = conn.cursor()
        cursor.execute('INSERT INTO building (name, description) VALUES (?, ?)', (name, description))
        conn.commit()
    return redirect(url_for('index'))

# Add Room
@app.route('/add_room', methods=['POST'])
def add_room():
    name = request.form['name']
    live_camera = request.form['live_camera']
    building_id = request.form['building_id']
    with sqlite3.connect(r'ai-hackathon.db') as conn:
        cursor = conn.cursor()
        cursor.execute('INSERT INTO room (name, live_camera, building_id) VALUES (?, ?, ?)', 
                       (name, live_camera, building_id))
        conn.commit()
    return redirect(url_for('index'))

# Add Device
@app.route('/add_device', methods=['POST'])
def add_device():
    hardware_id = request.form['hardware_id']
    name = request.form['name']
    is_enabled = int(request.form['is_enabled'])
    persons_before_enabled = int(request.form['persons_before_enabled'])
    delay_before_enabled = int(request.form['delay_before_enabled'])
    persons_before_disabled = int(request.form['persons_before_disabled'])
    delay_before_disabled = int(request.form['delay_before_disabled'])
    room_id = int(request.form['room_id'])
    with sqlite3.connect(r'ai-hackathon.db') as conn:
        cursor = conn.cursor()
        cursor.execute('''
        INSERT INTO device (hardware_id, name, is_enabled, persons_before_enabled, delay_before_enabled, persons_before_disabled, delay_before_disabled, room_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (hardware_id, name, is_enabled, persons_before_enabled, delay_before_enabled, persons_before_disabled, delay_before_disabled, room_id))
        conn.commit()
    return redirect(url_for('index'))

# Home Page
@app.route('/')
def index():
    with sqlite3.connect(r'ai-hackathon.db') as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM building')
        buildings = cursor.fetchall()
        cursor.execute('SELECT * FROM room')
        rooms = cursor.fetchall()
        cursor.execute('SELECT * FROM device')
        devices = cursor.fetchall()
    return render_template('index.html', buildings=buildings, rooms=rooms, devices=devices)

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
