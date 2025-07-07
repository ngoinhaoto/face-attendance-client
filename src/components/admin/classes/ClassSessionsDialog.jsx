import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
  AccessTime as TimeIcon,
  PeopleAlt as PeopleIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import adminService from "../../../api/adminService";
import { format, parseISO } from "date-fns";
import SessionAttendanceDialog from "./SessionAttendanceDialog";
import cacheService from "../../../utils/cacheService";

const ClassSessionsDialog = ({ open, classData, onClose, onUpdate }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [openAttendanceDialog, setOpenAttendanceDialog] = useState(false);
  const [selectedSessionForAttendance, setSelectedSessionForAttendance] =
    useState(null);

  // Form state for new/edited session
  const [sessionForm, setSessionForm] = useState({
    session_date: new Date().toISOString().split("T")[0],
    start_time: new Date().toISOString().slice(0, 16),
    end_time: new Date(new Date().setHours(new Date().getHours() + 1))
      .toISOString()
      .slice(0, 16),
    notes: "",
  });

  // Fetch sessions when dialog opens
  useEffect(() => {
    if (open && classData) {
      fetchSessions();
    }
  }, [open, classData]);

  const fetchSessions = async () => {
    if (!classData) return;

    try {
      setLoading(true);
      const data = await adminService.getClassSessions(classData.id);
      setSessions(data || []);
    } catch (error) {
      console.error("Error fetching class sessions:", error);
      setError("Failed to load sessions for this class");
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setSessionForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    // Get current date in local timezone
    const now = new Date();
    const oneHourLater = new Date(now);
    oneHourLater.setHours(now.getHours() + 1);

    // Format for input fields (YYYY-MM-DDThh:mm)
    const localDateStr = now.toISOString().split("T")[0];
    const localStartTimeStr = formatDateTimeForInput(now);
    const localEndTimeStr = formatDateTimeForInput(oneHourLater);

    setSessionForm({
      session_date: localDateStr,
      start_time: localStartTimeStr,
      end_time: localEndTimeStr,
      notes: "",
    });
    setSelectedSession(null);
  };

  // Add this helper function to format dates for datetime-local inputs in local timezone
  const formatDateTimeForInput = (date) => {
    if (!date) return "";

    // Get local parts
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    // Format as YYYY-MM-DDThh:mm (standard format for datetime-local inputs)
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleOpenAddForm = () => {
    resetForm();
    setIsAdding(true);
    setIsEditing(false);
  };

  const handleOpenEditForm = (session) => {
    setSelectedSession(session);

    // Parse session dates and convert to local timezone
    const sessionDate = new Date(session.session_date);
    const startTime = new Date(session.start_time);
    const endTime = new Date(session.end_time);

    setSessionForm({
      session_date: sessionDate.toISOString().split("T")[0],
      start_time: formatDateTimeForInput(startTime),
      end_time: formatDateTimeForInput(endTime),
      notes: session.notes || "",
    });

    setIsEditing(true);
    setIsAdding(false);
  };

  const handleCreateSession = async () => {
    try {
      setLoading(true);
      setError("");

      // Validate form
      if (
        !sessionForm.session_date ||
        !sessionForm.start_time ||
        !sessionForm.end_time
      ) {
        setError("Date, start time, and end time are required");
        setLoading(false);
        return;
      }

      // Create Date objects with the user's timezone
      const sessionDate = new Date(sessionForm.session_date);
      const startTime = new Date(sessionForm.start_time);
      const endTime = new Date(sessionForm.end_time);

      // Prepare data for API
      const sessionData = {
        class_id: classData.id,
        session_date: sessionDate.toISOString(),
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        notes: sessionForm.notes,
      };

      await adminService.createClassSession(sessionData);
      // Invalidate dashboard caches
      cacheService.invalidateByPrefix("teacher_dashboard_");
      cacheService.invalidateByPrefix("admin_dashboard_");

      // Refresh sessions
      await fetchSessions();

      // Notify parent component
      if (onUpdate) onUpdate();

      // Reset form and close it
      resetForm();
      setIsAdding(false);

      toast.success("Session created successfully");
    } catch (error) {
      console.error("Error creating session:", error);
      setError(error.response?.data?.detail || "Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSession = async () => {
    if (!selectedSession) return;

    try {
      setLoading(true);
      setError("");

      // Validate form
      if (
        !sessionForm.session_date ||
        !sessionForm.start_time ||
        !sessionForm.end_time
      ) {
        setError("Date, start time, and end time are required");
        setLoading(false);
        return;
      }

      // Prepare data for API
      const sessionData = {
        class_id: classData.id,
        session_date: new Date(sessionForm.session_date),
        start_time: new Date(sessionForm.start_time),
        end_time: new Date(sessionForm.end_time),
        notes: sessionForm.notes,
      };

      await adminService.updateClassSession(selectedSession.id, sessionData);

      // Refresh sessions
      await fetchSessions();

      // Notify parent component
      if (onUpdate) onUpdate();

      // Reset form and close it
      resetForm();
      setIsEditing(false);

      toast.success("Session updated successfully");
    } catch (error) {
      console.error("Error updating session:", error);
      setError(error.response?.data?.detail || "Failed to update session");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      setLoading(true);

      await adminService.deleteClassSession(sessionId);

      // Force clear all cached data
      adminService.clearCache();

      // Refresh sessions
      await fetchSessions();

      // Notify parent component to refresh class data (including session counts)
      if (onUpdate) onUpdate();

      toast.success("Session deleted successfully");
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Failed to delete session");
    } finally {
      setLoading(false);
    }
  };

  const handleViewAttendance = (session) => {
    setSelectedSessionForAttendance(session);
    setOpenAttendanceDialog(true);
  };

  const formatDateTime = (dateTimeStr) => {
    try {
      return format(parseISO(dateTimeStr), "MMM d, yyyy h:mm a");
    } catch (error) {
      return dateTimeStr;
    }
  };

  const sortedSessions = [...sessions].sort((a, b) => {
    // Sort by date, then by start time
    const dateCompare = new Date(a.session_date) - new Date(b.session_date);
    if (dateCompare !== 0) return dateCompare;
    return new Date(a.start_time) - new Date(b.start_time);
  });

  if (!classData) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Class Sessions for {classData.name} ({classData.class_code})
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!isAdding && !isEditing && (
          <Box sx={{ mb: 3, position: "relative", minHeight: "300px" }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6">Sessions</Typography>
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                onClick={handleOpenAddForm}
                disabled={loading}
              >
                Add Session
              </Button>
            </Box>

            {/* Show sessions list always, but with overlay when loading */}
            <Box sx={{ position: "relative" }}>
              {sortedSessions.length > 0 ? (
                <List>
                  {sortedSessions.map((session, index) => (
                    <Paper key={session.id} sx={{ mb: 2, p: 2 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Box>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: "bold" }}
                          >
                            Session #{index + 1}{" "}
                            <Typography
                              component="span"
                              variant="caption"
                              color="text.secondary"
                            >
                              (ID: {session.id})
                            </Typography>
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mt: 1,
                            }}
                          >
                            <EventIcon
                              sx={{ mr: 1, color: "text.secondary" }}
                            />
                            <Typography variant="body2">
                              {formatDateTime(session.session_date)}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mt: 1,
                            }}
                          >
                            <TimeIcon sx={{ mr: 1, color: "text.secondary" }} />
                            <Typography variant="body2">
                              {formatDateTime(session.start_time)} -{" "}
                              {formatDateTime(session.end_time)}
                            </Typography>
                          </Box>
                          {session.notes && (
                            <Typography
                              variant="body2"
                              sx={{ mt: 1, color: "text.secondary" }}
                            >
                              Notes: {session.notes}
                            </Typography>
                          )}
                        </Box>
                        <Box>
                          <IconButton
                            color="primary"
                            onClick={() => handleOpenEditForm(session)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            color="info"
                            onClick={() => handleViewAttendance(session)}
                            title="View Attendance"
                          >
                            <PeopleIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteSession(session.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </List>
              ) : (
                <Typography
                  color="text.secondary"
                  sx={{ p: 2, textAlign: "center" }}
                >
                  No sessions scheduled for this class yet
                </Typography>
              )}

              {/* Loading overlay */}
              {loading && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(255, 255, 255, 0.7)",
                    zIndex: 1,
                  }}
                >
                  <CircularProgress />
                </Box>
              )}
            </Box>
          </Box>
        )}

        {(isAdding || isEditing) && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              {isAdding ? "Add New Session" : "Edit Session"}
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  margin="dense"
                  label="Session Date"
                  type="date"
                  name="session_date"
                  value={sessionForm.session_date}
                  onChange={handleFormChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  margin="dense"
                  label="Start Time"
                  type="datetime-local"
                  name="start_time"
                  value={sessionForm.start_time}
                  onChange={handleFormChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  margin="dense"
                  label="End Time"
                  type="datetime-local"
                  name="end_time"
                  value={sessionForm.end_time}
                  onChange={handleFormChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  margin="dense"
                  label="Notes"
                  multiline
                  rows={2}
                  name="notes"
                  value={sessionForm.notes}
                  onChange={handleFormChange}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      resetForm();
                      setIsAdding(false);
                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    disabled={loading}
                    onClick={
                      isAdding ? handleCreateSession : handleUpdateSession
                    }
                  >
                    {loading ? (
                      <CircularProgress size={24} />
                    ) : isAdding ? (
                      "Add Session"
                    ) : (
                      "Update Session"
                    )}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}

        <SessionAttendanceDialog
          open={openAttendanceDialog}
          session={selectedSessionForAttendance}
          onClose={() => {
            setOpenAttendanceDialog(false);
            setSelectedSessionForAttendance(null);
          }}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClassSessionsDialog;
