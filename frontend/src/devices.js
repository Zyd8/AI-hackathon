import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './App.css';
import './ToggleSwitch.css';

const Sidebar = () => (
  <div className="sidebar">
    <h2>UEcoManage</h2>
  </div>
);

const DevicesPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [showEditDeviceModal, setShowEditDeviceModal] = useState(false);
  
  // New device state
  const [newDevice, setNewDevice] = useState({
    hardware_id: '',
    name: '',
    is_enabled: true,
    persons_before_enabled: 0,
    delay_before_enabled: 0,
    persons_before_disabled: 0,
    delay_before_disabled: 0
  });
  
  // Edit device state
  const [deviceToEdit, setDeviceToEdit] = useState(null);

  // Fetch room and devices data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch devices for the room first (since we already have the room ID)
        const [devicesResponse, buildingResponse] = await Promise.all([
          axios.get(`http://localhost:5000/api/rooms/${roomId}/devices`),
          axios.get('http://localhost:5000/api/buildings')
        ]);
        
        // Find which building contains our room
        let roomData = null;
        for (const building of buildingResponse.data) {
          const roomsResponse = await axios.get(`http://localhost:5000/api/buildings/${building.id}/rooms`);
          const foundRoom = roomsResponse.data.find(r => r.id === parseInt(roomId));
          if (foundRoom) {
            roomData = {
              ...foundRoom,
              buildingName: building.name
            };
            break;
          }
        }
        
        setRoom(roomData);
        setDevices(devicesResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [roomId]);

  // Handle input change for add device form
  const handleAddInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewDevice(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle input change for edit device form
  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDeviceToEdit(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Add a new device
  const addDevice = async () => {
    try {
      const response = await axios.post(`http://localhost:5000/api/rooms/${roomId}/devices`, {
        ...newDevice,
        hardware_id: parseInt(newDevice.hardware_id),
        persons_before_enabled: parseInt(newDevice.persons_before_enabled),
        delay_before_enabled: parseInt(newDevice.delay_before_enabled),
        persons_before_disabled: parseInt(newDevice.persons_before_disabled),
        delay_before_disabled: parseInt(newDevice.delay_before_disabled)
      });
      
      setDevices([...devices, response.data]);
      setShowAddDeviceModal(false);
      setNewDevice({
        hardware_id: '',
        name: '',
        is_enabled: true,
        persons_before_enabled: 0,
        delay_before_enabled: 0,
        persons_before_disabled: 0,
        delay_before_disabled: 0
      });
    } catch (error) {
      console.error('Error adding device:', error);
    }
  };

  // Update a device
  const updateDevice = async () => {
    if (!deviceToEdit) return;
    
    try {
      const response = await axios.put(`http://localhost:5000/api/devices/${deviceToEdit.id}`, {
        ...deviceToEdit,
        hardware_id: parseInt(deviceToEdit.hardware_id),
        persons_before_enabled: parseInt(deviceToEdit.persons_before_enabled),
        delay_before_enabled: parseInt(deviceToEdit.delay_before_enabled),
        persons_before_disabled: parseInt(deviceToEdit.persons_before_disabled),
        delay_before_disabled: parseInt(deviceToEdit.delay_before_disabled)
      });
      
      setDevices(devices.map(device => 
        device.id === deviceToEdit.id ? response.data : device
      ));
      setShowEditDeviceModal(false);
      setDeviceToEdit(null);
    } catch (error) {
      console.error('Error updating device:', error);
    }
  };

  // Delete a device
  const deleteDevice = async (deviceId) => {
    if (window.confirm('Are you sure you want to delete this device?')) {
      try {
        await axios.delete(`http://localhost:5000/api/devices/${deviceId}`);
        setDevices(devices.filter(device => device.id !== deviceId));
      } catch (error) {
        console.error('Error deleting device:', error);
      }
    }
  };

  // Open edit modal with device data
  const openEditModal = (device) => {
    setDeviceToEdit(device);
    setShowEditDeviceModal(true);
  };

  // Toggle device status
  const toggleDeviceStatus = async (device) => {
    try {
      const updatedDevice = { ...device, is_enabled: !device.is_enabled };
      const response = await axios.put(`http://localhost:5000/api/devices/${device.id}`, {
        ...updatedDevice,
        hardware_id: parseInt(updatedDevice.hardware_id),
        persons_before_enabled: parseInt(updatedDevice.persons_before_enabled),
        delay_before_enabled: parseInt(updatedDevice.delay_before_enabled),
        persons_before_disabled: parseInt(updatedDevice.persons_before_disabled),
        delay_before_disabled: parseInt(updatedDevice.delay_before_disabled)
      });
      
      setDevices(devices.map(d => 
        d.id === device.id ? response.data : d
      ));
    } catch (error) {
      console.error('Error toggling device status:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!room) {
    return <div>Room not found</div>;
  }

  return (
    <div className="app">
      <Sidebar />
      <div className="main-content">
        <div className="header">
          <h1>{room.name} - Devices</h1>
          <button 
            className="add-button" 
            onClick={() => setShowAddDeviceModal(true)}
          >
            + Add Device
          </button>
        </div>
        
        <div className="devices-grid">
          {devices.map((device) => (
            <div key={device.id} className="device-card">
              <div className="device-header">
                <h3>{device.name}</h3>
                <div className="device-actions">
                  <button 
                    className="edit-button"
                    onClick={() => openEditModal(device)}
                  >
                    Edit
                  </button>
                  <button 
                    className="delete-button"
                    onClick={() => deleteDevice(device.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="device-details">
                <p><strong>Hardware ID:</strong> {device.hardware_id}</p>
                <p className="status-toggle">
                  <strong>Status: </strong>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={device.is_enabled} 
                      onChange={() => toggleDeviceStatus(device)}
                    />
                    <span className="slider round"></span>
                  </label>
                  <span className="status-text">{device.is_enabled ? 'Enabled' : 'Disabled'}</span>
                </p>
                <p><strong>Enable when:</strong> {device.persons_before_enabled} persons for {device.delay_before_enabled}s</p>
                <p><strong>Disable when:</strong> {device.persons_before_disabled} persons for {device.delay_before_disabled}s</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Device Modal */}
      {showAddDeviceModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add New Device</h2>
              <button onClick={() => setShowAddDeviceModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Hardware ID:</label>
                <input 
                  type="number" 
                  name="hardware_id" 
                  value={newDevice.hardware_id}
                  onChange={handleAddInputChange}
                />
              </div>
              <div className="form-group">
                <label>Device Name:</label>
                <input 
                  type="text" 
                  name="name" 
                  value={newDevice.name}
                  onChange={handleAddInputChange}
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input 
                    type="checkbox" 
                    name="is_enabled" 
                    checked={newDevice.is_enabled}
                    onChange={handleAddInputChange}
                  />
                  Enabled
                </label>
              </div>
              <div className="form-group">
                <label>Enable when (persons):</label>
                <input 
                  type="number" 
                  name="persons_before_enabled" 
                  value={newDevice.persons_before_enabled}
                  onChange={handleAddInputChange}
                />
              </div>
              <div className="form-group">
                <label>Enable delay (seconds):</label>
                <input 
                  type="number" 
                  name="delay_before_enabled" 
                  value={newDevice.delay_before_enabled}
                  onChange={handleAddInputChange}
                />
              </div>
              <div className="form-group">
                <label>Disable when (persons):</label>
                <input 
                  type="number" 
                  name="persons_before_disabled" 
                  value={newDevice.persons_before_disabled}
                  onChange={handleAddInputChange}
                />
              </div>
              <div className="form-group">
                <label>Disable delay (seconds):</label>
                <input 
                  type="number" 
                  name="delay_before_disabled" 
                  value={newDevice.delay_before_disabled}
                  onChange={handleAddInputChange}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-button" onClick={() => setShowAddDeviceModal(false)}>Cancel</button>
              <button className="save-button" onClick={addDevice}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Device Modal */}
      {showEditDeviceModal && deviceToEdit && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Edit Device</h2>
              <button onClick={() => setShowEditDeviceModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Hardware ID:</label>
                <input 
                  type="number" 
                  name="hardware_id" 
                  value={deviceToEdit.hardware_id}
                  onChange={handleEditInputChange}
                />
              </div>
              <div className="form-group">
                <label>Device Name:</label>
                <input 
                  type="text" 
                  name="name" 
                  value={deviceToEdit.name}
                  onChange={handleEditInputChange}
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input 
                    type="checkbox" 
                    name="is_enabled" 
                    checked={deviceToEdit.is_enabled}
                    onChange={handleEditInputChange}
                  />
                  Enabled
                </label>
              </div>
              <div className="form-group">
                <label>Enable when (persons):</label>
                <input 
                  type="number" 
                  name="persons_before_enabled" 
                  value={deviceToEdit.persons_before_enabled}
                  onChange={handleEditInputChange}
                />
              </div>
              <div className="form-group">
                <label>Enable delay (seconds):</label>
                <input 
                  type="number" 
                  name="delay_before_enabled" 
                  value={deviceToEdit.delay_before_enabled}
                  onChange={handleEditInputChange}
                />
              </div>
              <div className="form-group">
                <label>Disable when (persons):</label>
                <input 
                  type="number" 
                  name="persons_before_disabled" 
                  value={deviceToEdit.persons_before_disabled}
                  onChange={handleEditInputChange}
                />
              </div>
              <div className="form-group">
                <label>Disable delay (seconds):</label>
                <input 
                  type="number" 
                  name="delay_before_disabled" 
                  value={deviceToEdit.delay_before_disabled}
                  onChange={handleEditInputChange}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-button" onClick={() => setShowEditDeviceModal(false)}>Cancel</button>
              <button className="save-button" onClick={updateDevice}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevicesPage;
