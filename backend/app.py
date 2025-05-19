import os
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(basedir, 'ai-hackathon.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Admin model
class Admin(db.Model):
    username = db.Column(db.String, primary_key=True, nullable=False)
    password = db.Column(db.String, nullable=False)

class Building(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String, nullable=False)
    description = db.Column(db.String, nullable=False)

class Room(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String, nullable=False)
    live_camera = db.Column(db.String, nullable=False, default='')
    building_id = db.Column(db.Integer, db.ForeignKey('building.id'), nullable=False)

class Device(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    hardware_id = db.Column(db.Integer, nullable=False)
    name = db.Column(db.String, nullable=False)
    is_enabled = db.Column(db.Boolean, nullable=False)
    persons_before_enabled = db.Column(db.Integer, nullable=False)
    delay_before_enabled = db.Column(db.Integer, nullable=False)
    persons_before_disabled = db.Column(db.Integer, nullable=False)
    delay_before_disabled = db.Column(db.Integer, nullable=False)
    room_id = db.Column(db.Integer, db.ForeignKey('room.id'), nullable=False)

db_initialized = False

@app.before_request
def initialize_database():
    global db_initialized
    if not db_initialized:
        db.create_all()
        if not Admin.query.filter_by(username='admin').first():
            new_admin = Admin(username='admin', password='admin')
            db.session.add(new_admin)
            db.session.commit()
        db_initialized = True

# Login route
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    admin = Admin.query.filter_by(username=username, password=password).first()
    if admin:
        return jsonify({'success': True, 'message': 'Login successful'})
    else:
        return jsonify({'success': False, 'message': 'Invalid username or password'}), 401

@app.route('/api/admins', methods=['GET'])
def get_admins():
    admins = Admin.query.all()
    admin_list = [{'username': admin.username, 'password': admin.password} for admin in admins]
    return jsonify(admin_list)

# get buildings (fetch)
@app.route('/api/buildings', methods=['GET'])
def get_buildings():
    try:
        buildings = Building.query.all()
        
        # Create a list of dictionaries with building details
        buildings_list = [{'id': building.id, 'name': building.name, 'description': building.description} for building in buildings]
        
        # Return the list as a JSON response
        return jsonify(buildings_list), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/buildings', methods=['POST'])
def add_building():
    try:
        data = request.get_json()

        name = data.get('name')
        description = data.get('description')

        if not name or not description:
            return jsonify({'success': False, 'message': 'Name and description are required'}), 400

        new_building = Building(name=name, description=description)


        db.session.add(new_building)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Building added successfully'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/buildings/<int:building_id>', methods=['PUT'])
def update_building(building_id):
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid JSON'}), 400

        name = data.get('name')
        description = data.get('description')

        if not name or not description:
            return jsonify({'error': 'Name and description are required'}), 400

        building = Building.query.get(building_id)
        if not building:
            return jsonify({'error': 'Building not found'}), 404

        # Update building fields
        building.name = name
        building.description = description
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Building updated successfully',
            'building': {
                'id': building.id,
                'name': building.name,
                'description': building.description
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

    
@app.route('/api/buildings/<int:building_id>/rooms', methods=['GET'])
def get_rooms(building_id):
    try:
        rooms = Room.query.filter_by(building_id=building_id).all()
        rooms_list = [{'id': room.id, 'name': room.name} for room in rooms]
        return jsonify(rooms_list), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    
@app.route('/api/buildings/<int:building_id>/rooms', methods=['POST'])
def add_room(building_id):
    try:
        data = request.get_json()
        name = data.get('name')
        live_camera = data.get('live_camera', '')  

        if not name:
            return jsonify({'success': False, 'message': 'Room name is required'}), 400

        building = Building.query.get(building_id)
        if not building:
            return jsonify({'success': False, 'message': 'Building not found'}), 404
        
        new_room = Room(name=name, live_camera=live_camera, building_id=building_id)
        db.session.add(new_room)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Room added successfully', 'room': {'id': new_room.id, 'name': new_room.name, 'live_camera': new_room.live_camera}}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/rooms/<int:room_id>', methods=['PUT'])
def update_room(room_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid JSON'}), 400

    name = data.get('name')
    live_camera = data.get('live_camera')

    if not name:
        return jsonify({'error': 'Room name is required'}), 400

    try:
        room = Room.query.get(room_id)
        if not room:
            return jsonify({'error': 'Room not found'}), 404

        room.name = name
        room.live_camera = live_camera
        db.session.commit()
        
        return jsonify({
    'success': True,
    'message': 'Room updated successfully',
    'room': {
        'id': room.id,
        'name': room.name,
        'live_camera': room.live_camera,
        'building_id': room.building_id
    }
}), 200
    except Exception as e:
        # Log the error for debugging
        app.logger.error(f"Error updating room: {e}")
        return jsonify({'error': 'Internal server error'}), 500
    
@app.route('/api/rooms/<int:room_id>/devices', methods=['GET'])
def get_devices(room_id):
    try:
        devices = Device.query.filter_by(room_id=room_id).all()
        devices_list = [{
            'id': d.id,
            'hardware_id': d.hardware_id,
            'name': d.name,
            'is_enabled': d.is_enabled,
            'persons_before_enabled': d.persons_before_enabled,
            'delay_before_enabled': d.delay_before_enabled,
            'persons_before_disabled': d.persons_before_disabled,
            'delay_before_disabled': d.delay_before_disabled
        } for d in devices]

        return jsonify(devices_list), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500 

if __name__ == '__main__':
    app.run(debug=True)
