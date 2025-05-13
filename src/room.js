import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './App.css';

const Sidebar = () => (
  <div className="sidebar">
    <h2>UEcoManage</h2>
    <Link to="/dashboard">Dashboard</Link>
    <Link to="/building-en">EN Building</Link>
    <Link to="/room" className="active">Room</Link>
  </div>
);

const BuildingNavbar = () => (
  <nav className="building-navbar">
    <Link to="/building-en" className="active">EN</Link>
    <Link to="/building-tyk">TYK</Link>
    <Link to="/building-lct">LCT</Link>
    <Link to="/building-admin">Admin</Link>
    <Link to="/building-old-academic">Old Academic</Link>
  </nav>
);

const RoomPage = () => {
  const initialDevices = [
    { id: 1, name: 'Aircon 1', room: 'EN405', wattage: '120W', online: true, type: 'Aircon' },
    { id: 2, name: 'Lights', room: 'EN405', wattage: '45W', online: false, type: 'Light' },
    { id: 3, name: 'Projector', room: 'EN402', wattage: '60W', online: true, type: 'Projector' }
  ];

  const [devices, setDevices] = useState(initialDevices);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('az');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDevice, setNewDevice] = useState({ name: '', room: '', wattage: '', online: false, type: '' });

  // Sort and filter logic
  const filteredDevices = devices
    .filter(device => `${device.name} ${device.room}`.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortOption === 'az') {
        return `${a.room} ${a.name}`.localeCompare(`${b.room} ${b.name}`);
      } else if (sortOption === 'za') {
        return `${b.room} ${b.name}`.localeCompare(`${a.room} ${a.name}`);
      } else if (sortOption === 'online') {
        return b.online - a.online; // Online first
      } else if (sortOption === 'offline') {
        return a.online - b.online; // Offline first
      } else if (sortOption === 'room-az') {
        return a.room.localeCompare(b.room); // Room A-Z
      } else if (sortOption === 'room-za') {
        return b.room.localeCompare(a.room); // Room Z-A
      } else if (sortOption === 'type') {
        return a.type.localeCompare(b.type); // Type A-Z
      }
      return 0;
    });

  const editDevice = (id) => {
    alert(`Edit device with ID ${id}`);
    // Future: open modal with device info pre-filled
  };

  const removeDevice = (id) => {
    const confirmRemove = window.confirm('Are you sure you want to remove this device?');
    if (confirmRemove) {
      setDevices(devices.filter(device => device.id !== id));
    }
  };

  const toggleModal = () => setIsModalOpen(!isModalOpen);

  const handleAddDevice = () => {
    if (newDevice.name && newDevice.room && newDevice.wattage && newDevice.type) {
      const id = devices.length ? Math.max(...devices.map(d => d.id)) + 1 : 1;
      setDevices([...devices, { ...newDevice, id }]);
      setNewDevice({ name: '', room: '', wattage: '', online: false, type: '' });
      toggleModal();
    } else {
      alert('Please fill in all fields.');
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main">
        <header>
          <h1>Energy Saver Admin</h1>
          <p style={{ color: '#475569', marginTop: '10px' }}>
            Monitor and manage energy usage across buildings with ease.
          </p>
        </header>

        <BuildingNavbar />

        <section className="camera-feed">
          <h2>Live Room Feed</h2>
          <div className="camera-box">
            <div className="camera-frame">
              <img src="http://localhost:5000/video_feed" alt="Live Camera Feed" className="camera-stream" />
            </div>
          </div>
        </section>

        <section className="devices">
          <div className="rooms-header">
            <h2>Devices</h2>
            <div className="controls-container">
              <div className="controls-left">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                  <option value="az">A–Z</option>
                  <option value="za">Z–A</option>
                  <option value="online">Online First</option>
                  <option value="offline">Offline First</option>
                  <option value="room-az">Room A–Z</option>
                  <option value="room-za">Room Z–A</option>
                  <option value="type">Type A–Z</option>
                </select>
              </div>
              <div className="controls-right">
                <button onClick={toggleModal}>Add</button>
                <button onClick={() => alert('Edit multiple functionality not implemented')}>Edit</button>
              </div>
            </div>
          </div>

          <div className="devices-grid">
            {filteredDevices.map((device) => (
              <div className="device-card" key={device.id}>
                <div className="device-icon">🔌</div>
                <div className="device-name">{`${device.name} - ${device.room}`}</div>
                <div className="device-status" style={{ color: device.online ? 'green' : 'red' }}>
                  {device.online ? '🟢' : '🔴'}
                </div>
                <div className="device-actions">
                  <button onClick={() => editDevice(device.id)}>✎</button>
                  <button onClick={() => removeDevice(device.id)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Modal for adding new device */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <button className="modal-close" onClick={toggleModal}>×</button>
            <h2>Add New Device</h2>
            <input
              type="text"
              placeholder="Device Name"
              value={newDevice.name}
              onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Room"
              value={newDevice.room}
              onChange={(e) => setNewDevice({ ...newDevice, room: e.target.value })}
            />
            <input
              type="text"
              placeholder="Wattage"
              value={newDevice.wattage}
              onChange={(e) => setNewDevice({ ...newDevice, wattage: e.target.value })}
            />
            <label>
              <input
                type="checkbox"
                checked={newDevice.online}
                onChange={(e) => setNewDevice({ ...newDevice, online: e.target.checked })}
              /> Online
            </label>
            <input
              type="text"
              placeholder="Type"
              value={newDevice.type}
              onChange={(e) => setNewDevice({ ...newDevice, type: e.target.value })}
            />
            <div className="modal-buttons">
              <button className="cancel-btn" onClick={toggleModal}>Cancel</button>
              <button onClick={handleAddDevice}>Add Device</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomPage;
