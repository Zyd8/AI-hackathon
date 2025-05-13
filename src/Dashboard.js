import React, { useState } from 'react';
import './App.css';
import { Link } from 'react-router-dom';

const Sidebar = () => (
  <div className="sidebar">
    <h2>UEcoManage</h2>
    <Link to="/dashboard" className="active">Dashboard</Link>
    <Link to="/building-en">EN Building</Link>
    <Link to="/room">Room</Link>
  </div>
);

const BuildingNavbar = () => (
  <nav className="building-navbar">
    <Link to="/building-en">EN</Link>
    <Link to="/building-tyk">TYK</Link>
    <Link to="/building-lct">LCT</Link>
    <Link to="/building-admin">Admin</Link>
    <Link to="/building-old-academic">Old Academic</Link>
  </nav>
);

const DeviceOverview = () => {
  const [devices, setDevices] = useState([
    { building: 'EN', room: 'EN405', device: 'Aircon', usage: '120W', status: 'Online' },
    { building: 'EN', room: 'EN405', device: 'Light', usage: '45W', status: 'Offline' },
    { building: 'EN', room: 'EN402', device: 'Projector', usage: '60W', status: 'Online' },
  ]);

  const [rooms, setRooms] = useState([
    { building: 'EN', room: 'EN405' },
    { building: 'EN', room: 'EN402' }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('az');
  const [modalStep, setModalStep] = useState(0);
  const [formMode, setFormMode] = useState('add');
  const [formType, setFormType] = useState('');
  const [formData, setFormData] = useState({
    building: '',
    room: '',
    device: '',
    usage: '',
    status: 'Online'
  });

  const [editMode, setEditMode] = useState(false);

  const toggleEditMode = () => {
    setEditMode(!editMode); // Placeholder
  };

  const filteredDevices = devices
    .filter(d =>
      d.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.device.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOption === 'az') return a.room.localeCompare(b.room);
      if (sortOption === 'za') return b.room.localeCompare(a.room);
      if (sortOption === 'online') {
        if (a.status === 'Online' && b.status !== 'Online') return -1;
        if (a.status !== 'Online' && b.status === 'Online') return 1;
        return a.room.localeCompare(b.room);
      }
      if (sortOption === 'offline') {
        if (a.status === 'Offline' && b.status !== 'Offline') return -1;
        if (a.status !== 'Offline' && b.status === 'Offline') return 1;
        return a.room.localeCompare(b.room);
      }
      return 0;
    });

  const openInitialModal = (mode) => {
    setFormMode(mode);
    setModalStep(1);
    setFormType('');
    setFormData({ building: '', room: '', device: '', usage: '', status: 'Online' });
  };

  const handleTypeSelect = (type) => {
    setFormType(type);
    setModalStep(2);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (formMode === 'add') {
      if (formType === 'device') {
        setDevices(prev => [...prev, formData]);
      } else if (formType === 'room') {
        setRooms(prev => [...prev, { building: formData.building, room: formData.room }]);
        alert(`Room "${formData.room}" added in building "${formData.building}".`);
      }
    }
    setModalStep(0);
  };

  return (
    <section className="status-table">
      <div className="overview-header">
        <h2>Device Overview</h2>
        <div className="controls-container">
          <div className="controls-left">
            <input
              type="text"
              placeholder="Search by room or device"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <select
              value={sortOption}
              onChange={e => setSortOption(e.target.value)}
            >
              <option value="az">Room A–Z</option>
              <option value="za">Room Z–A</option>
              <option value="online">Online First</option>
              <option value="offline">Offline First</option>
            </select>
          </div>
          <div className="controls-right">
            <button onClick={() => openInitialModal('add')}>Add</button>
            <button>Edit</button>
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Building</th>
            <th>Room</th>
            <th>Device</th>
            <th>Power Usage</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredDevices.map((device, index) => (
            <tr key={index}>
              <td>{device.building}</td>
              <td>{device.room}</td>
              <td>{device.device}</td>
              <td>{device.usage}</td>
              <td>
                <span className={`status ${device.status.toLowerCase()}`}>
                  {device.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal Step 1: Type Selection */}
      {modalStep === 1 && (
        <div className="modal-overlay">
          <div className="modal">
            <button className="modal-close" onClick={() => setModalStep(0)}>×</button>
            <h3>{formMode === 'add' ? 'Add' : 'Edit'} - Choose Type</h3>
            <div className="modal-buttons center-buttons">
              <button type="button" className="cancel-btn" onClick={() => setModalStep(0)}>Cancel</button>
              <button onClick={() => handleTypeSelect('device')}>Device</button>
              <button onClick={() => handleTypeSelect('room')}>Room</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Step 2: Form Input */}
      {modalStep === 2 && formType && (
        <div className="modal-overlay">
          <div className="modal">
            <button className="modal-close" onClick={() => setModalStep(0)}>×</button>
            <h3>{formType === 'device' ? 'Add Device' : 'Add Room'}</h3>
            <form onSubmit={handleFormSubmit}>
              <label>
                Building:
                <select
                  value={formData.building}
                  onChange={e => setFormData({ ...formData, building: e.target.value })}
                  required
                >
                  <option value="">Select Building</option>
                  <option value="EN">EN</option>
                  <option value="TYK">TYK</option>
                  <option value="LCT">LCT</option>
                  <option value="Admin">Admin</option>
                  <option value="Old Academic">Old Academic</option>
                </select>
              </label>
              {formType === 'device' ? (
                <>
                  <label>
                    Room:
                    <select
                      value={formData.room}
                      onChange={e => setFormData({ ...formData, room: e.target.value })}
                      required
                    >
                      <option value="">Select Room</option>
                      {rooms.map((r, idx) => (
                        <option key={idx} value={r.room}>{r.room}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Device:
                    <select
                      value={formData.device}
                      onChange={e => setFormData({ ...formData, device: e.target.value })}
                      required
                    >
                      <option value="">Select Device</option>
                      <option value="Aircon">Aircon</option>
                      <option value="Light">Light</option>
                      <option value="Projector">Projector</option>
                      <option value="TV">TV</option>
                      <option value="PC">PC</option>
                      <option value="Fan">Fan</option>
                    </select>
                  </label>
                  <label>
                    Power Usage:
                    <input
                      type="text"
                      placeholder="e.g. 60W"
                      value={formData.usage}
                      onChange={e => setFormData({ ...formData, usage: e.target.value })}
                      required
                    />
                  </label>
                </>
              ) : (
                <label>
                  Room:
                  <input
                    type="text"
                    placeholder="e.g. EN301"
                    value={formData.room}
                    onChange={e => setFormData({ ...formData, room: e.target.value })}
                    required
                  />
                </label>
              )}
              <div className="modal-buttons center-buttons">
                <button type="button" className="cancel-btn" onClick={() => setModalStep(1)}>Back</button>
                <button type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

const Dashboard = () => (
  <div className="dashboard-container">
    <Sidebar />
    <div className="main">
      <header>
        <h1>Welcome, Admin!</h1>
        <p style={{ color: '#475569', marginTop: '10px' }}>
          Monitor and manage energy usage across buildings with ease.
        </p>
      </header>
      <BuildingNavbar />
      <DeviceOverview />
    </div>
  </div>
);

export default Dashboard;
