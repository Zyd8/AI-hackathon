# EcoVolt:AI-Hackathon Smart Building Management System

This project is a smart building management system that combines a ReactJS frontend, Flask backend, YOLOv11-powered camera integration, and ESP32-based smart outlets. The system allows administrators to manage buildings, rooms, and IoT devices, automate device control based on room occupancy, and monitor live camera feeds.

---

## Table of Contents
- [Features](#features)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [ESP32 Device Setup](#esp32-device-setup)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)

---

## Features
- Admin authentication (login/logout)
- Manage buildings, rooms, and devices
- Live camera feed and person detection (YOLOv11)
- Automated device control based on occupancy
- Real-time device status and communication

## Project Structure
```
AI-hackathon/
├── backend/        # Flask API server
├── frontend/       # ReactJS client
├── embedded/       # ESP32/IoT code (optional)
├── requirements.txt
└── README.md
```

---

## Setup Instructions

### 1. Backend Setup (Flask)
1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```
2. **Create and activate a Python virtual environment (optional but recommended):**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. **Install dependencies:**
   ```bash
   pip install -r ../requirements.txt
   ```
4. **Run the backend server:**
   ```bash
   python app.py
   ```
   The backend will start on `http://127.0.0.1:5000/` by default.

### 2. Frontend Setup (ReactJS)
1. **Navigate to the frontend directory:**
   ```bash
   cd ../frontend
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Start the frontend development server:**
   ```bash
   npm start
   ```
   The frontend will start on `http://localhost:3000/` by default.

### 3. ESP32 Device Setup (Optional)
- Upload the provided code in the `embedded/` directory to your ESP32 smart outlet.
- Make sure the ESP32 can reach the backend server's API endpoints over the network.

---

## Usage
- Access the frontend at [http://localhost:3000/](http://localhost:3000/)
- Log in with the default admin credentials (`admin`/`admin`).
- Add buildings, rooms, and devices via the web interface.
- View live camera feeds and monitor device status.
- Devices will be automatically controlled based on person detection if configured.

## Troubleshooting
- Ensure both backend and frontend servers are running.
- Check network/firewall settings for device communication.
- For camera/YOLO issues, verify dependencies (`ultralytics`, `opencv-python-headless`, `torch`, etc.) are installed.
- Use browser dev tools or backend logs for debugging errors.

---

For further questions, please refer to the code comments or contact the project maintainer.
