import React from 'react';
import './App.css';

const Sidebar = () => (
  <div className="sidebar">
    <h2>UEcoManage</h2>
    <a href="/dashboard" className="active">Dashboard</a>
    <a href="/en">EN Building</a>
    <a href="/room">Room</a>
  </div>
);

const BuildingNavbar = () => (
  <nav className="building-navbar">
    <a href="/building-en">EN</a>
    <a href="/building-tyk">TYK</a>
    <a href="/building-lct">LCT</a>
    <a href="/building-admin">Admin</a>
    <a href="/building-old-academic">Old Academic</a>
  </nav>
);

const DeviceOverview = () => (
  <section className="status-table">
    <h2>Device Overview</h2>
    <table>
      <thead>
        <tr>
          <th>Room</th>
          <th>Device</th>
          <th>Power Usage</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>EN405</td>
          <td>Aircon 1</td>
          <td>120W</td>
          <td><span className="status online">Online</span></td>
        </tr>
        <tr>
          <td>EN405</td>
          <td>Lights</td>
          <td>45W</td>
          <td><span className="status offline">Offline</span></td>
        </tr>
        <tr>
          <td>EN402</td>
          <td>Projector</td>
          <td>60W</td>
          <td><span className="status online">Online</span></td>
        </tr>
      </tbody>
    </table>
  </section>
);

const AddEditButtons = () => (
  <section className="add-buttons">
    <button onClick={() => window.location.href = '/add-device'}>Add</button>
    <button onClick={() => window.location.href = '/edit-device'}>Edit</button>
  </section>
);

const Dashboard = () => {
  return (
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
        <AddEditButtons />
      </div>
    </div>
  );
};

export default Dashboard;