import os
from datetime import datetime
from flask import Flask, request, jsonify, Response
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from camera import camera_service

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

# Device model
class Device(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    hardware_id = db.Column(db.String(64), unique=True, nullable=False)
    name = db.Column(db.String(128), nullable=False, default="Smart Outlet")
    is_enabled = db.Column(db.Boolean, nullable=False, default=False)
    last_seen = db.Column(db.DateTime, nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    room_id = db.Column(db.Integer, db.ForeignKey('room.id'), nullable=True)
    persons_before_enabled = db.Column(db.Integer, nullable=True)
    delay_before_enabled = db.Column(db.Integer, nullable=True)
    persons_before_disabled = db.Column(db.Integer, nullable=True)
    delay_before_disabled = db.Column(db.Integer, nullable=True)
    is_manual = db.Column(db.Boolean, nullable=False, default=False)

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

# Device status check endpoint - used by ESP32 to check its status
@app.route('/api/device/status', methods=['GET'])
def get_device_status():
    hardware_id = request.args.get('hardware_id')
    if not hardware_id:
        return jsonify([]), 200  # Return empty array if no hardware_id provided
    
    try:
        # Convert hardware_id to string for comparison
        hardware_id = str(hardware_id)
        
        # Find device by hardware_id
        device = db.session.execute(
            db.select(Device).filter_by(hardware_id=hardware_id)
        ).scalar_one_or_none()
        
        if not device:
            return jsonify([]), 200  # Return empty array if device not found
            
        # Update last seen timestamp
        device.last_seen = datetime.utcnow()
        
        # Update IP address if available
        if request.remote_addr:
            device.ip_address = request.remote_addr
            
        db.session.commit()
        
        # Return device information in the expected format
        return jsonify([{
            'id': device.id,
            'hardware_id': device.hardware_id,
            'name': device.name,
            'is_enabled': device.is_enabled,
            'persons_before_enabled': device.persons_before_enabled or 0,
            'delay_before_enabled': device.delay_before_enabled or 0,
            'persons_before_disabled': device.persons_before_disabled or 0,
            'delay_before_disabled': device.delay_before_disabled or 0,
            'room_id': device.room_id,
            'is_manual': device.is_manual
        }])
        
    except Exception as e:
        app.logger.error(f"Error in get_device_status: {str(e)}")
        return jsonify({'error': str(e)}), 500

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

@app.route('/api/buildings/<int:building_id>', methods=['PUT', 'DELETE'])
def handle_building(building_id):
    if request.method == 'PUT':
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
    
    elif request.method == 'DELETE':
        try:
            building = Building.query.get(building_id)
            if not building:
                return jsonify({'success': False, 'message': 'Building not found'}), 404
            
            # First delete all rooms in the building
            Room.query.filter_by(building_id=building_id).delete()
            
            # Then delete the building
            db.session.delete(building)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Building and all associated rooms deleted successfully'
            }), 200
            
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Error deleting building: {e}")
            return jsonify({
                'success': False,
                'message': 'Failed to delete building. Please try again.'
            }), 500

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


@app.route('/api/rooms/<int:room_id>', methods=['PUT', 'DELETE'])
def handle_room(room_id):
    if request.method == 'PUT':
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
    
    elif request.method == 'DELETE':
        try:
            room = Room.query.get(room_id)
            if not room:
                return jsonify({'success': False, 'message': 'Room not found'}), 404
            
            # First delete all devices in the room
            Device.query.filter_by(room_id=room_id).delete()
            
            # Then delete the room
            db.session.delete(room)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Room and all associated devices deleted successfully'
            }), 200
            
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Error deleting room: {e}")
            return jsonify({
                'success': False,
                'message': 'Failed to delete room. Please try again.'
            }), 500
    
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
            'delay_before_disabled': d.delay_before_disabled,
            'room_id': d.room_id,
            'is_manual': d.is_manual
        } for d in devices]

        return jsonify(devices_list), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/rooms/<int:room_id>/devices', methods=['POST'])
def add_device(room_id):
    try:
        data = request.get_json()
        
        # Check if room exists
        room = db.session.get(Room, room_id)
        if not room:
            return jsonify({'success': False, 'message': 'Room not found'}), 404
        
        # Validate required fields
        required_fields = ['hardware_id', 'name']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'message': f'Missing or empty required field: {field}'}), 400
        
        # Check if device with this hardware_id already exists
        existing_device = db.session.execute(
            db.select(Device).filter_by(hardware_id=str(data['hardware_id']))
        ).scalar_one_or_none()
        if existing_device:
            return jsonify({
                'success': False, 
                'message': 'A device with this hardware ID already exists',
                'existing_device_id': existing_device.id
            }), 409
        
        # Create new device with default values for optional fields
        new_device = Device(
            hardware_id=str(data['hardware_id']),
            name=str(data['name']),
            is_enabled=bool(data.get('is_enabled', False)),
            persons_before_enabled=int(data.get('persons_before_enabled', 1)) if data.get('persons_before_enabled') is not None else None,
            delay_before_enabled=int(data.get('delay_before_enabled', 5)) if data.get('delay_before_enabled') is not None else None,
            persons_before_disabled=int(data.get('persons_before_disabled', 0)) if data.get('persons_before_disabled') is not None else None,
            delay_before_disabled=int(data.get('delay_before_disabled', 5)) if data.get('delay_before_disabled') is not None else None,
            room_id=room_id,
            last_seen=datetime.utcnow(),
            is_manual=bool(data.get('is_manual', False))
        )
        
        db.session.add(new_device)
        db.session.commit()
        
        # Prepare response
        device_data = {
            'id': new_device.id,
            'hardware_id': new_device.hardware_id,
            'name': new_device.name,
            'is_enabled': new_device.is_enabled,
            'persons_before_enabled': new_device.persons_before_enabled,
            'delay_before_enabled': new_device.delay_before_enabled,
            'persons_before_disabled': new_device.persons_before_disabled,
            'delay_before_disabled': new_device.delay_before_disabled,
            'room_id': new_device.room_id,
            'last_seen': new_device.last_seen.isoformat() if new_device.last_seen else None,
            'ip_address': new_device.ip_address,
            'is_manual': new_device.is_manual
        }
        
        return jsonify({
            'success': True,
            'message': 'Device added successfully',
            'device': device_data
        }), 201
        
    except ValueError as ve:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Invalid data format: {str(ve)}'}), 400
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error adding device: {str(e)}")
        return jsonify({
            'success': False, 
            'message': f'Failed to add device: {str(e)}'
        }), 500

@app.route('/api/devices/<int:device_id>', methods=['PUT'])
def update_device(device_id):
    try:
        data = request.get_json()
        device = db.session.get(Device, device_id)
        
        if not device:
            return jsonify({
                'success': False, 
                'message': 'Device not found'
            }), 404
        
        # Check if room exists if room_id is being updated
        if 'room_id' in data and data['room_id'] is not None:
            room = db.session.get(Room, data['room_id'])
            if not room:
                return jsonify({
                    'success': False, 
                    'message': 'Room not found'
                }), 404
            device.room_id = data['room_id']
        
        # Update basic fields
        if 'hardware_id' in data:
            device.hardware_id = str(data['hardware_id'])
        if 'name' in data:
            device.name = str(data['name'])
        if 'is_enabled' in data:
            device.is_enabled = bool(data['is_enabled'])
        if 'is_manual' in data:
            device.is_manual = bool(data['is_manual'])
        
        # Update optional fields if they exist in the request
        optional_fields = [
            'persons_before_enabled',
            'delay_before_enabled',
            'persons_before_disabled',
            'delay_before_disabled'
        ]
        
        for field in optional_fields:
            if field in data and data[field] is not None:
                setattr(device, field, int(data[field]) if data[field] is not None else None)
        
        # Update last seen timestamp
        device.last_seen = datetime.utcnow()
        
        db.session.commit()
        
        # Prepare the response
        updated_device = {
            'id': device.id,
            'hardware_id': device.hardware_id,
            'name': device.name,
            'is_enabled': device.is_enabled,
            'room_id': device.room_id,
            'persons_before_enabled': device.persons_before_enabled,
            'delay_before_enabled': device.delay_before_enabled,
            'persons_before_disabled': device.persons_before_disabled,
            'delay_before_disabled': device.delay_before_disabled,
            'last_seen': device.last_seen.isoformat() if device.last_seen else None,
            'ip_address': device.ip_address,
            'is_manual': device.is_manual
        }
        
        return jsonify({
            'success': True,
            'message': 'Device updated successfully',
            'device': updated_device
        }), 200
        
    except ValueError as ve:
        db.session.rollback()
        return jsonify({
            'success': False, 
            'message': f'Invalid data format: {str(ve)}'
        }), 400
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error updating device: {str(e)}")
        return jsonify({
            'success': False, 
            'message': f'Failed to update device: {str(e)}'
        }), 500

@app.route('/api/devices/<int:device_id>', methods=['DELETE'])
def delete_device(device_id):
    try:
        device = Device.query.get(device_id)
        
        if not device:
            return jsonify({'success': False, 'message': 'Device not found'}), 404
        
        db.session.delete(device)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Device deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/camera/feed/<int:room_id>')
def camera_feed(room_id):
    """Video streaming route. Put this in the src attribute of an img tag."""
    room = Room.query.get(room_id)
    if not room or not room.live_camera:
        return jsonify({'error': 'Camera not found or not configured'}), 404
    
    # Add camera if not already added
    camera_service.add_camera(str(room_id), room.live_camera)
    
    def generate():
        while True:
            frame = camera_service.get_frame(str(room_id))
            if frame is None:
                break
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
    
    return Response(generate(),
                   mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/api/camera/status/<int:room_id>')
def camera_status(room_id):
    """Check if camera is available."""
    room = Room.query.get(room_id)
    if not room or not room.live_camera:
        return jsonify({'available': False, 'message': 'Camera not configured'})
    
    camera_service.add_camera(str(room_id), room.live_camera)
    frame = camera_service.get_frame(str(room_id))
    
    return jsonify({
        'available': frame is not None,
        'has_camera': True,
        'camera_url': room.live_camera
    })

# Person count API endpoint
@app.route('/api/person_count/<camera_id>', methods=['GET'])
def get_person_count(camera_id):
    with camera_service.lock:
        if camera_id not in camera_service.cameras:
            return jsonify({"error": "Camera not found"}), 404
        _, _, last_update, person_count = camera_service.cameras[camera_id]
        return jsonify({
            "camera_id": camera_id,
            "person_count": person_count,
            "last_update": last_update
        })

# Add cleanup on app exit
import atexit
atexit.register(camera_service.cleanup)

import threading
import time

def ai_device_scheduler():
    # Track state for delay logic
    last_enable_time = {}
    last_disable_time = {}
    while True:
        with app.app_context():
            devices = Device.query.filter_by(is_manual=False).all()
            for device in devices:
                room_id = str(device.room_id)
                person_count = camera_service.get_person_count(room_id)
                now = time.time()
                # Enable logic
                if person_count is not None and device.persons_before_enabled is not None and device.delay_before_enabled is not None:
                    if person_count >= device.persons_before_enabled:
                        # Start/continue enable timer
                        if device.id not in last_enable_time:
                            last_enable_time[device.id] = now
                        if now - last_enable_time[device.id] >= device.delay_before_enabled:
                            if not device.is_enabled:
                                device.is_enabled = True
                                db.session.commit()
                    else:
                        last_enable_time[device.id] = now
                # Disable logic
                if person_count is not None and device.persons_before_disabled is not None and device.delay_before_disabled is not None:
                    if person_count <= device.persons_before_disabled:
                        # Start/continue disable timer
                        if device.id not in last_disable_time:
                            last_disable_time[device.id] = now
                        if now - last_disable_time[device.id] >= device.delay_before_disabled:
                            if device.is_enabled:
                                device.is_enabled = False
                                db.session.commit()
                    else:
                        last_disable_time[device.id] = now
        time.sleep(2)

# Start the AI device automation thread
threading.Thread(target=ai_device_scheduler, daemon=True).start()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
