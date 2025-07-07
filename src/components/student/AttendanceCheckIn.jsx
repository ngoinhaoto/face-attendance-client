import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import {
  Box,
  Typography,
  Paper,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import {
  Check as CheckIcon,
  CameraAlt as CameraIcon,
  Schedule as ClockIcon,
} from "@mui/icons-material";
import apiService from "../../api/apiService";
import { clearCachePattern } from "../../utils/apiCache";

// Import utility functions from dateUtils
import { formatDate, formatTime, isSessionActive } from "../../utils/dateUtils";

const AttendanceCheckIn = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [processingAttendance, setProcessingAttendance] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [sessionInfo, setSessionInfo] = useState(null);

  // Camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState(null);

  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Load user's classes on component mount
  useEffect(() => {
    fetchUserClasses();

    // Cleanup function to stop camera on unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Fetch sessions when class is selected
  useEffect(() => {
    if (selectedClassId) {
      fetchClassSessions(selectedClassId);
    } else {
      setSessions([]);
      setSelectedSessionId("");
      setSessionInfo(null);
    }
  }, [selectedClassId]);

  // Fetch session details when session is selected
  useEffect(() => {
    if (selectedSessionId) {
      fetchSessionDetails(selectedSessionId);
    } else {
      setSessionInfo(null);
    }
  }, [selectedSessionId]);

  const fetchUserClasses = async () => {
    try {
      setLoading(true);
      setError("");

      let response;

      // Get classes based on user role
      if (user.role === "admin") {
        // Admins can see all classes
        response = await apiService.get("/classes");
      } else if (user.role === "teacher") {
        // Teachers see classes they teach
        response = await apiService.get("/users/me/classes");
      } else {
        // Students see classes they're enrolled in
        response = await apiService.get("/users/me/classes");
      }

      setClasses(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching classes:", error);
      setError("Failed to load your classes. Please try again.");
      setLoading(false);
    }
  };

  const fetchClassSessions = async (classId) => {
    try {
      setSessionLoading(true);

      const response = await apiService.get(`/classes/${classId}/sessions`);

      // Filter to show only today's and future sessions
      const now = new Date();
      const todaySessions = response.data.filter((session) => {
        const sessionDate = new Date(session.session_date);
        return sessionDate.toDateString() === now.toDateString();
      });

      setSessions(todaySessions);

      setSessionLoading(false);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      setError("Failed to load class sessions.");
      setSessions([]);
      setSessionLoading(false);
    }
  };

  const fetchSessionDetails = async (sessionId) => {
    try {
      setSessionLoading(true);

      const response = await apiService.get(`/classes/sessions/${sessionId}`);
      setSessionInfo(response.data);

      // Also check if user already has attendance for this session
      try {
        const attendanceResponse = await apiService.get(
          `/attendance/my-attendance?session_id=${sessionId}`,
        );
        if (attendanceResponse.data && attendanceResponse.data.status) {
          setSuccessMessage(
            `You've already checked in for this session (${attendanceResponse.data.status})`,
          );
        } else {
          setSuccessMessage("");
        }
      } catch (err) {
        // If 404, user hasn't checked in yet, which is fine
        if (err.response && err.response.status !== 404) {
          console.error("Error checking attendance status:", err);
        }
        setSuccessMessage("");
      }

      setSessionLoading(false);
    } catch (error) {
      console.error("Error fetching session details:", error);
      setError("Failed to load session details.");
      setSessionInfo(null);
      setSessionLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      setError("");
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsCameraOpen(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError(
        "Could not access camera. Please check permissions and try again.",
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsCameraOpen(false);
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame on the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        "image/jpeg",
        0.9,
      );
    });
  };

  const handleCheckIn = async () => {
    if (!selectedSessionId) {
      setError("Please select a session first.");
      return;
    }

    if (!isCameraOpen) {
      startCamera();
      return;
    }

    try {
      setProcessingAttendance(true);
      setError("");

      // Capture image
      const imageBlob = await captureImage();
      if (!imageBlob) {
        setError("Failed to capture image.");
        setProcessingAttendance(false);
        return;
      }

      // Create form data
      const formData = new FormData();
      formData.append("file", imageBlob, "check-in.jpg");

      // Send to API
      const response = await apiService.post(
        `/attendance/check-in?session_id=${selectedSessionId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      // Handle success
      stopCamera();
      setProcessingAttendance(false);

      // Display success message with status
      if (response.data.status === "PRESENT") {
        setSuccessMessage(`Successfully checked in! You are present.`);
      } else if (response.data.status === "LATE") {
        setSuccessMessage(
          `Checked in late (${response.data.late_minutes} minutes).`,
        );
      } else {
        setSuccessMessage(`Attendance recorded as: ${response.data.status}`);
      }
    } catch (error) {
      console.error("Check-in error:", error);
      setProcessingAttendance(false);

      if (error.response) {
        // Server responded with error
        const errorMsg = error.response.data?.detail || "Failed to check in.";

        if (errorMsg.includes("No face detected")) {
          setError(
            "No face detected in the image. Please ensure your face is clearly visible and try again.",
          );
        } else if (errorMsg.includes("Face not recognized")) {
          setError(
            "Your face was not recognized. Please make sure you have registered your face in your profile.",
          );
        } else if (errorMsg.includes("Only students")) {
          setError(
            "This feature is currently limited to students. Please contact your administrator.",
          );
        } else {
          setError(errorMsg);
        }
      } else {
        setError("Network error. Please try again.");
      }
    }
  };

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold" }}>
        Attendance Check-In
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          onClose={() => setSuccessMessage("")}
        >
          {successMessage}
        </Alert>
      )}

      {/* Class and Session Selection */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Select Class and Session
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth disabled={loading}>
              <InputLabel>Select Class</InputLabel>
              <Select
                value={selectedClassId}
                label="Select Class"
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                <MenuItem value="">
                  <em>Select a class</em>
                </MenuItem>
                {classes.map((cls) => (
                  <MenuItem key={cls.id} value={cls.id}>
                    {cls.name} ({cls.class_code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl
              fullWidth
              disabled={!selectedClassId || sessionLoading}
            >
              <InputLabel>Select Session</InputLabel>
              <Select
                value={selectedSessionId}
                label="Select Session"
                onChange={(e) => setSelectedSessionId(e.target.value)}
              >
                <MenuItem value="">
                  <em>Select a session</em>
                </MenuItem>
                {sessions.map((session) => (
                  <MenuItem
                    key={session.id}
                    value={session.id}
                    sx={{
                      fontWeight: isSessionActive(session) ? "bold" : "normal",
                      color: isSessionActive(session)
                        ? "primary.main"
                        : "text.primary",
                    }}
                  >
                    {formatTime(session.start_time)} -{" "}
                    {formatTime(session.end_time)}
                    {isSessionActive(session) && (
                      <Chip
                        size="small"
                        color="primary"
                        label="Active Now"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {sessionLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </Paper>

      {/* Session Information */}
      {sessionInfo && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Session Information
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Class
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {sessionInfo.class_name}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary">
                  Date
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {formatDate(sessionInfo.session_date)}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Time
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {formatTime(sessionInfo.start_time)} -{" "}
                  {formatTime(sessionInfo.end_time)}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  icon={
                    isSessionActive(sessionInfo) ? <ClockIcon /> : undefined
                  }
                  color={isSessionActive(sessionInfo) ? "primary" : "default"}
                  label={
                    isSessionActive(sessionInfo) ? "Active Now" : "Not Active"
                  }
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Face Recognition Check-In
        </Typography>

        {isCameraOpen ? (
          <Box>
            <Box
              sx={{
                position: "relative",
                width: "100%",
                maxWidth: "640px",
                height: 0,
                paddingBottom: "75%",
                margin: "0 auto",
                mb: 2,
                borderRadius: 2,
                overflow: "hidden",
                bgcolor: "black",
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              <canvas ref={canvasRef} style={{ display: "none" }} />

              {processingAttendance && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                  }}
                >
                  <CircularProgress color="primary" />
                </Box>
              )}
            </Box>

            <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<CheckIcon />}
                onClick={handleCheckIn}
                disabled={processingAttendance}
              >
                {processingAttendance ? "Processing..." : "Check In"}
              </Button>

              <Button
                variant="outlined"
                onClick={stopCamera}
                disabled={processingAttendance}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ textAlign: "center", py: 3 }}>
            <Typography variant="body1" paragraph>
              Click the button below to start your camera and check in to the
              selected session.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<CameraIcon />}
              onClick={handleCheckIn}
              disabled={!selectedSessionId || processingAttendance}
            >
              {selectedSessionId ? "Start Camera" : "Select a Session First"}
            </Button>
          </Box>
        )}
      </Paper>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 2, textAlign: "center" }}
      >
        Note: Make sure your face is clearly visible and well-lit for accurate
        recognition.
      </Typography>
    </Box>
  );
};

export default AttendanceCheckIn;
