import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './App.css';
import './ToggleSwitch.css';
import { FaHome, FaBuilding, FaDoorOpen } from 'react-icons/fa';

const Sidebar = () => (
  <div className="sidebar">
    <h2>UEcoManage</h2>
    <a href="/dashboard" className="sidebar-link"><FaHome style={{marginRight:8}}/>Dashboard</a>
    <a href="/building" className="sidebar-link"><FaBuilding style={{marginRight:8}}/>Building</a>
    <a href="/room" className="sidebar-link active"><FaDoorOpen style={{marginRight:8}}/>Room</a>
  </div>
);

const DevicesPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cameraAvailable, setCameraAvailable] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(true);
  const [cameraError, setCameraError] = useState(null);
  const [cameraUrl, setCameraUrl] = useState('');
  
  // Add a timestamp to force image refresh
  const [timestamp, setTimestamp] = useState(Date.now());
  
  // Refresh camera feed only when camera is available and component is mounted
  useEffect(() => {
    if (!cameraAvailable || !cameraUrl) return;
    
    const interval = setInterval(() => {
      setTimestamp(Date.now());
    }, 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, [cameraAvailable, cameraUrl]);
  
  // Check camera status when room changes
  useEffect(() => {
    let isMounted = true;
    
    const checkCameraStatus = async () => {
      if (!roomId) return;
      
      try {
        setCameraLoading(true);
        const response = await axios.get(`http://localhost:5000/api/camera/status/${roomId}`);
        if (isMounted) {
          setCameraAvailable(response.data.available);
          setCameraUrl(response.data.camera_url || '');
        }
      } catch (error) {
        console.error('Error checking camera status:', error);
        if (isMounted) {
          setCameraError('Failed to check camera status');
          setCameraAvailable(false);
        }
      } finally {
        if (isMounted) {
          setCameraLoading(false);
        }
      }
    };
    
    checkCameraStatus();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [roomId]);
  
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
      // First, check if device with this hardware ID exists
      const checkResponse = await axios.get(`http://localhost:5000/api/device/status?hardware_id=${newDevice.hardware_id}`);
      
      let device;
      
      if (checkResponse.data && checkResponse.data.length > 0) {
        // Device exists, update it
        const existingDevice = checkResponse.data[0];
        const updateResponse = await axios.put(`http://localhost:5000/api/devices/${existingDevice.id}`, {
          ...existingDevice,
          name: newDevice.name || existingDevice.name,
          room_id: parseInt(roomId),
          is_enabled: newDevice.is_enabled,
          persons_before_enabled: parseInt(newDevice.persons_before_enabled) || 0,
          delay_before_enabled: parseInt(newDevice.delay_before_enabled) || 0,
          persons_before_disabled: parseInt(newDevice.persons_before_disabled) || 0,
          delay_before_disabled: parseInt(newDevice.delay_before_disabled) || 0
        });
        device = updateResponse.data.device;
      } else {
        // Create new device
        const response = await axios.post(`http://localhost:5000/api/rooms/${roomId}/devices`, {
          ...newDevice,
          hardware_id: newDevice.hardware_id, // Keep as string
          persons_before_enabled: parseInt(newDevice.persons_before_enabled) || 0,
          delay_before_enabled: parseInt(newDevice.delay_before_enabled) || 0,
          persons_before_disabled: parseInt(newDevice.persons_before_disabled) || 0,
          delay_before_disabled: parseInt(newDevice.delay_before_disabled) || 0
        });
        device = response.data;
      }
      
      // Refresh devices list
      const devicesResponse = await axios.get(`http://localhost:5000/api/rooms/${roomId}/devices`);
      setDevices(devicesResponse.data);
      
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
      alert('Failed to add device. Please check the hardware ID and try again.');
    }
  };

  // Update a device
  const updateDevice = async () => {
    if (!deviceToEdit) return;
    
    try {
      const response = await axios.put(`http://localhost:5000/api/devices/${deviceToEdit.id}`, {
        ...deviceToEdit,
        // Ensure numeric fields are properly formatted
        hardware_id: String(deviceToEdit.hardware_id),
        persons_before_enabled: parseInt(deviceToEdit.persons_before_enabled) || 0,
        delay_before_enabled: parseInt(deviceToEdit.delay_before_enabled) || 0,
        persons_before_disabled: parseInt(deviceToEdit.persons_before_disabled) || 0,
        delay_before_disabled: parseInt(deviceToEdit.delay_before_disabled) || 0,
        // Ensure room_id is included
        room_id: deviceToEdit.room_id || parseInt(roomId)
      });
      
      // Update the UI with the response from the backend
      setDevices(devices.map(device => 
        device.id === deviceToEdit.id ? response.data.device : device
      ));
      
      setShowEditDeviceModal(false);
      setDeviceToEdit(null);
    } catch (error) {
      console.error('Error updating device:', error);
      alert('Failed to update device. Please try again.');
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
      const newState = !device.is_enabled;
      
      // Update the device in the backend
      const response = await axios.put(`http://localhost:5000/api/devices/${device.id}`, {
        ...device,
        is_enabled: newState,
        // Ensure numeric fields are properly formatted
        hardware_id: String(device.hardware_id),
        persons_before_enabled: parseInt(device.persons_before_enabled) || 0,
        delay_before_enabled: parseInt(device.delay_before_enabled) || 0,
        persons_before_disabled: parseInt(device.persons_before_disabled) || 0,
        delay_before_disabled: parseInt(device.delay_before_disabled) || 0,
        // Ensure room_id is included if it exists
        room_id: device.room_id || null
      });
      
      // Update the UI with the response from the backend
      setDevices(devices.map(d => 
        d.id === device.id ? response.data.device : d
      ));
      
      console.log(`Device ${device.id} toggled to ${newState ? 'ON' : 'OFF'}`);
    } catch (error) {
      console.error('Error toggling device status:', error);
      // Show error to user
      alert('Failed to update device. Please try again.');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }
  
  // Generate camera feed URL with timestamp to prevent caching
  const cameraFeedUrl = `http://localhost:5000/api/camera/feed/${roomId}?t=${timestamp}`;

  if (!room) {
    return <div>Room not found</div>;
  }

  return (
    <div style={{display:'flex',minHeight:'100vh'}}>
      <Sidebar />
      <div className="main">
        <header>
          <h1>Devices in {room?.name}</h1>
          <p style={{ color: '#475569', marginTop: '10px' }}>
            {room?.buildingName} • {devices.length} {devices.length === 1 ? 'device' : 'devices'}
          </p>
        </header>
        
        {/* Camera Feed Section */}
        <div className="camera-feed-container">
          {cameraLoading ? (
            <div className="camera-loading">Loading camera feed...</div>
          ) : cameraAvailable ? (
            <div className="camera-feed">
              <img 
                src={cameraFeedUrl} 
                alt="Live camera feed" 
                onError={(e) => {
                  console.error('Error loading camera feed');
                  setCameraAvailable(false);
                }}
              />
              <div className="camera-info">
                <span className="camera-status active">LIVE</span>
                <span className="camera-url" title={cameraUrl}>
                  {cameraUrl.length > 30 ? `${cameraUrl.substring(0, 27)}...` : cameraUrl}
                </span>
              </div>
            </div>
          ) : (
            <div className="camera-unavailable">
              <div className="camera-icon">📷</div>
              <p>Camera feed is not available</p>
              {cameraError && <p className="error-message">{cameraError}</p>}
              <button 
                className="retry-button"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          )}
        </div>

        <div className="controls-right">
          <button onClick={() => setShowAddDeviceModal(true)}>Add Device</button>
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
