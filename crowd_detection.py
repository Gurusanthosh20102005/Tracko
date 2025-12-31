"""
Tracko - Real-time Crowd Detection using YOLO
Detects people in bus CCTV feed and sends updates to Tracko backend
"""

import cv2
import requests
import time
from datetime import datetime
from ultralytics import YOLO
import argparse
import json

# Configuration
TRACKO_API_URL = "http://localhost:3000/api/crowd/update"
UPDATE_INTERVAL = 2  # Send update every 2 seconds (faster for demo)
CONFIDENCE_THRESHOLD = 0.5  # Minimum confidence for person detection

class CrowdDetector:
    def __init__(self, vehicle_id, video_source=0, model_path='yolov8n.pt'):
        """
        Initialize the crowd detector
        
        Args:
            vehicle_id: Bus/vehicle identifier (e.g., "21G", "27C")
            video_source: Video source (0 for webcam, or RTSP URL)
            model_path: Path to YOLO model weights
        """
        self.vehicle_id = vehicle_id
        self.video_source = video_source
        self.model = YOLO(model_path)
        self.last_update_time = 0
        self.frame_count = 0
        
        print(f"🚌 Tracko Crowd Detector Initialized")
        print(f"   Vehicle ID: {vehicle_id}")
        print(f"   Video Source: {video_source}")
        print(f"   Model: {model_path}")
        print(f"   API Endpoint: {TRACKO_API_URL}")
        print(f"   Update Interval: {UPDATE_INTERVAL}s")
        print("-" * 50)
    
    def send_update(self, people_count):
        """Send crowd update to Tracko backend"""
        timestamp = datetime.now().isoformat()
        
        payload = {
            "vehicle_id": self.vehicle_id,
            "people_count": people_count,
            "timestamp": timestamp
        }
        
        try:
            response = requests.post(
                TRACKO_API_URL,
                json=payload,
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Update sent: {people_count} passengers | Crowd: {data.get('crowdLevel', 'N/A')}% | Time: {timestamp}")
                return True
            else:
                print(f"❌ Error: {response.status_code} - {response.text}")
                return False
                
        except requests.exceptions.ConnectionError:
            print(f"❌ Connection Error: Cannot reach Tracko backend at {TRACKO_API_URL}")
            print("   Make sure the backend server is running (node server/index.js)")
            return False
        except Exception as e:
            print(f"❌ Error sending update: {e}")
            return False
    
    def detect_people(self, frame):
        """Detect people in frame using YOLO"""
        # Run YOLO detection
        results = self.model(frame, classes=[0], conf=CONFIDENCE_THRESHOLD, verbose=False)
        
        # Count detected persons (class 0 = person in COCO dataset)
        people_count = len(results[0].boxes)
        
        # Draw bounding boxes
        annotated_frame = results[0].plot()
        
        return people_count, annotated_frame
    
    def run(self):
        """Main detection loop"""
        print(f"\n🎥 Starting video capture from: {self.video_source}")
        cap = cv2.VideoCapture(self.video_source)
        
        if not cap.isOpened():
            print(f"❌ Error: Cannot open video source: {self.video_source}")
            return
        
        print("✅ Video capture started successfully")
        print("📊 Starting crowd detection...")
        print("Press 'q' to quit\n")
        
        try:
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    print("⚠  End of video stream or cannot read frame")
                    break
                
                self.frame_count += 1
                
                # Detect people in frame
                people_count, annotated_frame = self.detect_people(frame)
                
                # Add info overlay
                current_time = time.time()
                cv2.putText(
                    annotated_frame, 
                    f'Vehicle: {self.vehicle_id}', 
                    (10, 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 
                    0.7, 
                    (0, 255, 0), 
                    2
                )
                cv2.putText(
                    annotated_frame, 
                    f'Passengers: {people_count}', 
                    (10, 60), 
                    cv2.FONT_HERSHEY_SIMPLEX, 
                    0.7, 
                    (0, 255, 0), 
                    2
                )
                cv2.putText(
                    annotated_frame, 
                    f'Frame: {self.frame_count}', 
                    (10, 90), 
                    cv2.FONT_HERSHEY_SIMPLEX, 
                    0.5, 
                    (255, 255, 255), 
                    1
                )
                
                # Send update to backend at specified interval
                if current_time - self.last_update_time >= UPDATE_INTERVAL:
                    self.send_update(people_count)
                    self.last_update_time = current_time
                    
                    # Add "SENT" indicator
                    cv2.putText(
                        annotated_frame, 
                        'UPDATE SENT', 
                        (10, 120), 
                        cv2.FONT_HERSHEY_SIMPLEX, 
                        0.5, 
                        (0, 255, 255), 
                        2
                    )
                
                # Display the frame
                cv2.imshow(f'Tracko Crowd Detection - Vehicle {self.vehicle_id}', annotated_frame)
                
                # Break on 'q' key
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    print("\n⏹  Stopping detection...")
                    break
                    
        except KeyboardInterrupt:
            print("\n⏹  Detection interrupted by user")
        finally:
            cap.release()
            cv2.destroyAllWindows()
            print("✅ Cleanup complete")


def main():
    parser = argparse.ArgumentParser(description='Tracko Real-time Crowd Detection')
    parser.add_argument(
        '--vehicle-id', 
        type=str, 
        required=True,
        help='Vehicle/Bus ID (e.g., 21G, 27C)'
    )
    parser.add_argument(
        '--video-source', 
        type=str, 
        default='0',
        help='Video source: 0 for webcam, or RTSP URL (default: 0)'
    )
    parser.add_argument(
        '--model', 
        type=str, 
        default='yolov8n.pt',
        help='YOLO model path (default: yolov8n.pt)'
    )
    parser.add_argument(
        '--interval', 
        type=int, 
        default=5,
        help='Update interval in seconds (default: 5)'
    )
    
    args = parser.parse_args()
    
    # Convert video source to int if it's a number
    try:
        video_source = int(args.video_source)
    except ValueError:
        video_source = args.video_source
    
    # Update global interval
    global UPDATE_INTERVAL
    UPDATE_INTERVAL = args.interval
    
    # Create and run detector
    detector = CrowdDetector(
        vehicle_id=args.vehicle_id,
        video_source=video_source,
        model_path=args.model
    )
    
    detector.run()


if __name__ == "__main__":
    main()
