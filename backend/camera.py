import cv2
import threading
import time
from ultralytics import YOLO
import numpy as np
from typing import Optional, Tuple, Dict

class CameraService:
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(CameraService, cls).__new__(cls)
                cls._instance._initialize()
        return cls._instance
    
    def _initialize(self):
        # Store (cv2.VideoCapture, current_frame, last_update_time, person_count)
        self.cameras: Dict[str, Tuple[cv2.VideoCapture, np.ndarray, float, int]] = {}
        self.model = YOLO("yolo11s.pt")
        self.lock = threading.Lock()
        self.running = True
        # Start the camera update thread
        self.thread = threading.Thread(target=self._update_cameras, daemon=True)
        self.thread.start()
    
    def add_camera(self, camera_id: str, source: str) -> bool:
        """Add a new camera feed.
        
        Args:
            camera_id: Unique identifier for the camera
            source: Can be an RTSP URL (e.g., 'rtsp://...') or a camera index (e.g., '0' for default webcam)
        """
        with self.lock:
            if camera_id in self.cameras:
                return True  # Already added
                
            # Check if source is a numeric camera index
            try:
                # Try to convert to int for local camera index
                camera_index = int(source)
                cap = cv2.VideoCapture(camera_index)
            except ValueError:
                # If not an int, treat as URL/RTSP
                cap = cv2.VideoCapture(source)
            if not cap.isOpened():
                print(f"Failed to open camera {camera_id} with source: {source}")
                return False
                
            # Store camera capture, current frame, last update time, and initial person count
            self.cameras[camera_id] = (cap, None, time.time(), 0)
            return True
    
    def remove_camera(self, camera_id: str):
        """Remove a camera feed."""
        with self.lock:
            if camera_id in self.cameras:
                cap, _, _ = self.cameras[camera_id]
                cap.release()
                del self.cameras[camera_id]
    
    def get_frame(self, camera_id: str) -> Optional[bytes]:
        """Get the latest frame from a camera as JPEG bytes."""
        with self.lock:
            if camera_id not in self.cameras:
                return None
                
            _, frame, _, _ = self.cameras[camera_id]
            if frame is None:
                return None
                
            # Convert frame to JPEG
            _, buffer = cv2.imencode('.jpg', frame)
            return buffer.tobytes()
    
    def _update_cameras(self):
        """Background thread to update camera frames."""
        while self.running:
            with self.lock:
                for camera_id, (cap, _, _, _) in list(self.cameras.items()):
                    ret, frame = cap.read()
                    person_count = 0
                    if ret:
                        # Run object detection
                        results = self.model.predict(source=frame, conf=0.5, verbose=False)
                        if len(results) > 0 and len(results[0].boxes) > 0:
                            boxes = results[0].boxes
                            # Count persons (YOLO class 0 is 'person')
                            for box in boxes:
                                if hasattr(box, 'cls'):
                                    cls_id = int(box.cls[0]) if hasattr(box.cls, '__getitem__') else int(box.cls)
                                    if cls_id == 0:
                                        person_count += 1
                            # Overlay person count on frame
                            frame = results[0].plot()
                            cv2.putText(frame, f'Persons: {person_count}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 2, cv2.LINE_AA)
                        # Update frame, timestamp, and person_count
                        self.cameras[camera_id] = (cap, frame, time.time(), person_count)
                    else:
                        print(f"Failed to read from camera {camera_id}")
                        # Reconnect after a short delay
                        cap.release()
                        cap = cv2.VideoCapture(camera_id)
                        self.cameras[camera_id] = (cap, None, time.time(), 0)
            
            time.sleep(0.033)  # ~30 FPS
    
    def get_person_count(self, camera_id: str) -> Optional[int]:
        """Get the number of persons detected in the latest frame."""
        with self.lock:
            if camera_id not in self.cameras:
                return None
            _, _, _, person_count = self.cameras[camera_id]
            return person_count

    def cleanup(self):
        """Clean up resources."""
        self.running = False
        if self.thread.is_alive():
            self.thread.join()
            
        with self.lock:
            for cap, _, _ in self.cameras.values():
                cap.release()
            self.cameras.clear()

# Global instance
camera_service = CameraService()
