import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Grid,
} from "@mui/material";
import apiService from "../../api/apiService";
import { format, parseISO } from "date-fns";

const SessionDetailsPage = () => {
  const { classId, sessionId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessionData, setSessionData] = useState(null);
  const [classData, setClassData] = useState(null);

  useEffect(() => {
    fetchSessionData();
  }, [sessionId]);

  const fetchSessionData = async () => {
    try {
      setLoading(true);
      setError("");

      const sessionResponse = await apiService.get(
        `/classes/sessions/${sessionId}`,
      );
      setSessionData(sessionResponse.data);

      if (sessionResponse.data.class_id) {
        const classResponse = await apiService.get(
          `/classes/${sessionResponse.data.class_id}`,
        );
        setClassData(classResponse.data);
      }
    } catch (error) {
      console.error("Error fetching session data:", error);
      setError("Failed to load session information");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return format(parseISO(dateStr), "EEEE, MMMM d, yyyy");
    } catch (error) {
      return dateStr;
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return format(parseISO(dateStr), "h:mm a");
    } catch (error) {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!sessionData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Session not found or you don't have permission to view it.
        </Alert>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => navigate("/dashboard")}
        >
          Return to Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Session Details
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom>
              {classData?.name} ({classData?.class_code})
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" fontWeight="bold">
              Date:
            </Typography>
            <Typography variant="body1">
              {formatDate(sessionData.session_date)}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" fontWeight="bold">
              Time:
            </Typography>
            <Typography variant="body1">
              {formatTime(sessionData.start_time)} -{" "}
              {formatTime(sessionData.end_time)}
            </Typography>
          </Grid>

          {sessionData.location && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold">
                Location:
              </Typography>
              <Typography variant="body1">{sessionData.location}</Typography>
            </Grid>
          )}

          {sessionData.notes && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold">
                Notes:
              </Typography>
              <Typography variant="body1">{sessionData.notes}</Typography>
            </Grid>
          )}
        </Grid>
      </Paper>

      <Grid container spacing={2}>
        <Grid item>
          <Button
            variant="contained"
            color="primary"
            onClick={() =>
              navigate(
                `/dashboard/classes/${classId}/sessions/${sessionId}/attendance`,
              )
            }
          >
            View Attendance
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="outlined"
            onClick={() => navigate(`/dashboard/classes/${classId}/sessions`)}
          >
            Back to Sessions
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SessionDetailsPage;
