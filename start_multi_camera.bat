@echo off
REM Tracko Multi-Camera Launcher
REM Run multiple crowd detection cameras for different buses

echo ========================================
echo   Tracko Multi-Camera Launcher
echo ========================================
echo.

REM Start backend server
echo Starting Tracko Server...
start "Tracko Server" cmd /k "cd server && node server.js"
timeout /t 3 >nul

echo.
echo Starting Camera Feeds...
echo.

REM Camera 1 - Bus 12A (Default Webcam)
echo Starting Camera 1: Bus 12A (Webcam 0)
start "Camera 1 - Bus 12A" cmd /k "python crowd_detection.py --vehicle-id 12A --video-source 0 --interval 2"
timeout /t 2 >nul

REM Camera 2 - Bus 45C (Optional: External camera Index 1, or use video file)
REM Uncomment and modify the line below if you have a second camera or video file
REM start "Camera 2 - Bus 45C" cmd /k "python crowd_detection.py --vehicle-id 45C --video-source 1 --interval 2"

REM Camera 3 - Bus 21G (Optional: Video file for testing)
REM start "Camera 3 - Bus 21G" cmd /k "python crowd_detection.py --vehicle-id 21G --video-source path/to/video.mp4 --interval 2"

echo.
echo ========================================
echo   All cameras started!
echo ========================================
echo.
echo Instructions:
echo - Each camera window shows detection for its bus
echo - Press 'q' in any camera window to stop that feed
echo - Close this window to stop all
echo.
echo Server running at: http://localhost:3000
echo.
pause
