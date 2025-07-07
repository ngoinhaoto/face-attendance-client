import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Typography,
  Divider,
  Box,
  Chip,
  Avatar,
  CircularProgress,
  Autocomplete,
  Alert,
} from "@mui/material";
import {
  PersonRemove as RemoveIcon,
  PersonAdd as AddIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import adminService from "../../../api/adminService";
import { toast } from "react-toastify";
import cacheService from "../../../utils/cacheService";

const ClassStudentsDialog = ({ open, classData, onClose, onUpdate }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [error, setError] = useState("");

  // Fetch students in the class
  const fetchClassStudents = async () => {
    if (!classData) return;

    try {
      setLoadingStudents(true);
      const data = await adminService.getClassStudents(classData.id);
      setStudents(data || []);
    } catch (error) {
      console.error("Error fetching class students:", error);
      toast.error("Failed to load students for this class");
    } finally {
      setLoadingStudents(false);
    }
  };

  // Fetch all students that can be added to the class
  const fetchAvailableStudents = async () => {
    try {
      setLoading(true);
      // Get all users with student role
      const users = await adminService.getUsers({ role: "student" });

      // Filter out students already in the class
      const studentIds = students.map((student) => student.id);
      const available = users.filter((user) => !studentIds.includes(user.id));

      setAvailableStudents(available);
    } catch (error) {
      console.error("Error fetching available students:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add student to class
  const handleAddStudent = async () => {
    if (!selectedStudent) return;

    try {
      setLoading(true);
      setError("");

      await adminService.addStudentToClass(classData.id, selectedStudent.id);
      // Invalidate dashboard caches
      cacheService.invalidateByPrefix("teacher_dashboard_");
      cacheService.invalidateByPrefix("admin_dashboard_");

      // Refresh lists
      await fetchClassStudents();
      await fetchAvailableStudents();

      // Notify parent component of the update
      if (onUpdate) onUpdate();

      setSelectedStudent(null);
      toast.success(
        `${
          selectedStudent.full_name || selectedStudent.username
        } added to class`,
      );
    } catch (error) {
      console.error("Error adding student to class:", error);
      setError(
        error.response?.data?.detail || "Failed to add student to class",
      );
      toast.error("Failed to add student to class");
    } finally {
      setLoading(false);
    }
  };

  // Remove student from class
  const handleRemoveStudent = async (studentId) => {
    try {
      setLoading(true);

      await adminService.removeStudentFromClass(classData.id, studentId);

      // Refresh lists
      await fetchClassStudents();
      await fetchAvailableStudents();

      // Notify parent component of the update
      if (onUpdate) onUpdate();

      toast.success("Student removed from class");
    } catch (error) {
      console.error("Error removing student from class:", error);
      toast.error("Failed to remove student from class");
    } finally {
      setLoading(false);
    }
  };

  // Load data when dialog opens
  useEffect(() => {
    if (open && classData) {
      fetchClassStudents();
    }
  }, [open, classData]);

  // Load available students after we have the class students
  useEffect(() => {
    if (open && classData) {
      fetchAvailableStudents();
    }
  }, [students, open, classData]);

  if (!classData) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Manage Students for {classData.name} ({classData.class_code})
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Add Student to Class
          </Typography>

          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Autocomplete
              options={availableStudents}
              getOptionLabel={(option) =>
                `${option.full_name || option.username} (${
                  option.student_id || "No ID"
                })`
              }
              value={selectedStudent}
              onChange={(event, newValue) => {
                setSelectedStudent(newValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search Students"
                  fullWidth
                  variant="outlined"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loading ? <CircularProgress size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              loading={loading}
              sx={{ flexGrow: 1 }}
            />

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddStudent}
              disabled={!selectedStudent || loading}
            >
              Add
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          Students in this Class ({students.length})
        </Typography>

        {loadingStudents ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        ) : students.length > 0 ? (
          <List>
            {students.map((student) => (
              <ListItem key={student.id} divider>
                <ListItemText
                  primary={student.full_name || student.username}
                  secondary={
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        alignItems: "center",
                        mt: 0.5,
                      }}
                    >
                      <Chip
                        size="small"
                        label={student.student_id || "No ID"}
                        variant="outlined"
                      />
                      <Typography variant="body2" color="text.secondary">
                        {student.email}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    color="error"
                    onClick={() => handleRemoveStudent(student.id)}
                    disabled={loading}
                  >
                    <RemoveIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography color="text.secondary" sx={{ p: 2, textAlign: "center" }}>
            No students in this class yet
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClassStudentsDialog;
