import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  People as PeopleIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
} from "@mui/icons-material";
import adminService from "../../api/adminService";
import apiService from "../../api/apiService";
import { toast } from "react-toastify";
import { format, parseISO } from "date-fns";
import { formatDateTimeForInput } from "../../utils/dateUtils";

const ClassSessionsPage = () => {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [classData, setClassData] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  const [sessionForm, setSessionForm] = useState({
    session_date: new Date().toISOString().split("T")[0],
    start_time: new Date().toISOString().slice(0, 16),
    end_time: new Date(new Date().setHours(new Date().getHours() + 1))
      .toISOString()
      .slice(0, 16),
    notes: "",
  });

  const [sortField, setSortField] = useState("date_desc");

  useEffect(() => {
    fetchClassData();
    fetchSessions();
  }, [classId]);

  const fetchClassData = async () => {
    try {
      const response = await apiService.get(`/classes/${classId}`);
      setClassData(response.data);
    } catch (error) {
      console.error("Error fetching class:", error);
      setError("Failed to load class information");
    }
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const data = await adminService.getClassSessions(classId);
      setSessions(data || []);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      setError("Failed to load sessions");
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
  };

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return "N/A";
    try {
      return format(parseISO(dateTimeStr), "MMM d, yyyy h:mm a");
    } catch (error) {
      return dateTimeStr;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return format(parseISO(dateStr), "MMM d, yyyy");
    } catch (error) {
      return dateStr;
    }
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (session) => {
    setSelectedSession(session);
    setSessionForm({
      session_date: new Date(session.session_date).toISOString().split("T")[0],
      start_time: formatDateTimeForInput(new Date(session.start_time)),
      end_time: formatDateTimeForInput(new Date(session.end_time)),
      notes: session.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (session) => {
    setSelectedSession(session);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateSession = async () => {
    try {
      setLoading(true);

      // Validate form
      if (
        !sessionForm.session_date ||
        !sessionForm.start_time ||
        !sessionForm.end_time
      ) {
        setError("Date, start time, and end time are required");
        return;
      }

      // Prepare data for API
      const sessionData = {
        class_id: parseInt(classId),
        session_date: sessionForm.session_date,
        start_time: sessionForm.start_time,
        end_time: sessionForm.end_time,
        notes: sessionForm.notes,
      };

      await adminService.createClassSession(sessionData);
      adminService.clearCache(); // Force clear all cached data

      // Refresh sessions
      await fetchSessions();

      // Reset form and close dialog
      resetForm();
      setIsAddDialogOpen(false);

      toast.success("Session created successfully");
    } catch (error) {
      console.error("Error creating session:", error);
      setError(error.response?.data?.detail || "Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSession = async () => {
    try {
      setLoading(true);

      // Validate form
      if (
        !sessionForm.session_date ||
        !sessionForm.start_time ||
        !sessionForm.end_time
      ) {
        setError("Date, start time, and end time are required");
        return;
      }

      // Prepare data for API
      const sessionData = {
        class_id: parseInt(classId),
        session_date: sessionForm.session_date,
        start_time: sessionForm.start_time,
        end_time: sessionForm.end_time,
        notes: sessionForm.notes,
      };

      await adminService.updateClassSession(selectedSession.id, sessionData);

      // Refresh sessions
      await fetchSessions();

      // Reset form and close dialog
      resetForm();
      setIsEditDialogOpen(false);

      toast.success("Session updated successfully");
    } catch (error) {
      console.error("Error updating session:", error);
      setError(error.response?.data?.detail || "Failed to update session");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async () => {
    try {
      setLoading(true);

      await adminService.deleteClassSession(selectedSession.id);

      // Refresh sessions
      await fetchSessions();

      // Close dialog
      setIsDeleteDialogOpen(false);

      toast.success("Session deleted successfully");
    } catch (error) {
      console.error("Error deleting session:", error);
      setError(error.response?.data?.detail || "Failed to delete session");
    } finally {
      setLoading(false);
    }
  };

  const handleViewAttendance = (session) => {
    navigate(`/dashboard/classes/${classId}/sessions/${session.id}/attendance`);
  };

  // Add this sorting logic before rendering sessions
  const sortedSessions = [...sessions].sort((a, b) => {
    if (sortField === "date_asc") {
      return new Date(a.session_date) - new Date(b.session_date);
    } else if (sortField === "date_desc") {
      return new Date(b.session_date) - new Date(a.session_date);
    } else if (sortField === "start_asc") {
      return new Date(a.start_time) - new Date(b.start_time);
    } else if (sortField === "start_desc") {
      return new Date(b.start_time) - new Date(a.start_time);
    }
    return 0;
  });

  if (loading && !classData) {
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

  return (
    <Box sx={{ py: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">
          Sessions for {classData?.name} ({classData?.class_code})
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortField}
              label="Sort By"
              onChange={(e) => setSortField(e.target.value)}
            >
              <MenuItem value="date_desc">Date (Newest First)</MenuItem>
              <MenuItem value="date_asc">Date (Oldest First)</MenuItem>
              <MenuItem value="start_asc">Start Time (Earliest)</MenuItem>
              <MenuItem value="start_desc">Start Time (Latest)</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
          >
            Add Session
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Sessions List */}
      <Paper sx={{ p: 2, position: "relative", minHeight: "300px" }}>
        {sortedSessions.length > 0 ? (
          <List>
            {sortedSessions.map((session) => (
              <Paper key={session.id} sx={{ mb: 2, p: 2, borderRadius: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Box>
                    <Typography variant="h6">
                      {formatDate(session.session_date)}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
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
                      onClick={() => handleOpenEditDialog(session)}
                      title="Edit Session"
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
                      onClick={() => handleOpenDeleteDialog(session)}
                      title="Delete Session"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              </Paper>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography color="text.secondary">
              No sessions scheduled for this class yet
            </Typography>
          </Box>
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
      </Paper>

      {/* Add Session Dialog */}
      <Dialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        maxWidth="md"
      >
        <DialogTitle>Add New Session</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
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
                type="text"
                name="notes"
                value={sessionForm.notes}
                onChange={handleFormChange}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateSession} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Session Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        maxWidth="md"
      >
        <DialogTitle>Edit Session</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
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
                type="text"
                name="notes"
                value={sessionForm.notes}
                onChange={handleFormChange}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateSession} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Session Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Session</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the session on{" "}
            {selectedSession && formatDate(selectedSession.session_date)}?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            This action cannot be undone. All attendance records for this
            session will also be deleted.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteSession}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClassSessionsPage;
