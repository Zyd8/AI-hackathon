from ultralytics import YOLO
import cv2


model = YOLO("yolo11s.pt") 

cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        break

   
    results = model.predict(source=frame, show=True, conf=0.5)

 
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
