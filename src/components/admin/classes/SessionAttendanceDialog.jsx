import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  IconButton,
  Alert,
  Select,
  MenuItem,
  FormControl,
  Grid,
  TextField,
} from "@mui/material";
import {
  Check as PresentIcon,
  Close as AbsentIcon,
  Schedule as LateIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { format, parseISO } from "date-fns";
import adminService from "../../../api/adminService";
import { toast } from "react-toastify";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = ["#4caf50", "#ff9800", "#f44336"]; // present, late, absent

const SessionAttendanceDialog = ({ open, session, onClose }) => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingRow, setEditingRow] = useState(null);
  const [editedStatus, setEditedStatus] = useState("");
  const [editedLateMinutes, setEditedLateMinutes] = useState(0);
  const [stats, setStats] = useState({
    present: 0,
    late: 0,
    absent: 0,
    totalStudents: 0,
    averageLateMinutes: 0,
  });

  // Fetch attendance when session changes
  useEffect(() => {
    if (open && session) {
      fetchAttendance();
    }
  }, [open, session]);

  // Calculate statistics whenever attendance data changes
  useEffect(() => {
    if (attendance.length > 0) {
      calculateStats();
    }
  }, [attendance]);

  const fetchAttendance = async () => {
    if (!session) return;

    try {
      setLoading(true);
      // This should use the correct endpoint from adminService
      const data = await adminService.getSessionAttendance(session.id);
      setAttendance(data || []);
    } catch (error) {
      console.error("Error fetching session attendance:", error);
      setError("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const present = attendance.filter(
      (a) => a.status?.toLowerCase() === "present",
    ).length;
    const late = attendance.filter(
      (a) => a.status?.toLowerCase() === "late",
    ).length;
    const absent = attendance.filter(
      (a) => a.status?.toLowerCase() === "absent",
    ).length;

    const lateStudents = attendance.filter(
      (a) => a.status?.toLowerCase() === "late",
    );
    const totalLateMinutes = lateStudents.reduce(
      (sum, student) => sum + (student.late_minutes || 0),
      0,
    );
    const averageLateMinutes =
      lateStudents.length > 0
        ? Math.round(totalLateMinutes / lateStudents.length)
        : 0;

    setStats({
      present,
      late,
      absent,
      totalStudents: attendance.length,
      averageLateMinutes,
    });
  };

  const handleStatusChange = (event) => {
    setEditedStatus(event.target.value);
  };

  const startEditing = (record) => {
    setEditingRow(record.student_id);
    setEditedStatus(record.status);
    setEditedLateMinutes(record.late_minutes || 0);
  };

  const cancelEditing = () => {
    setEditingRow(null);
    setEditedStatus("");
    setEditedLateMinutes(0);
  };

  const saveAttendanceChange = async (studentId) => {
    try {
      setLoading(true);
      await adminService.updateAttendanceStatus(
        session.id,
        studentId,
        editedStatus,
        editedStatus === "late" ? editedLateMinutes : 0,
      );
      await fetchAttendance(); // Refresh data
      setEditingRow(null);
      setEditedStatus("");
      setEditedLateMinutes(0);
      toast.success("Attendance updated");
    } catch (error) {
      setError("Failed to update attendance");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "N/A";
    try {
      return format(parseISO(timeStr), "h:mm a");
    } catch (error) {
      return timeStr || "N/A";
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return format(parseISO(dateStr), "MMMM d, yyyy");
    } catch (error) {
      return dateStr || "N/A";
    }
  };

  const getStatusChip = (status, lateMinutes) => {
    switch (status?.toLowerCase()) {
      case "present":
        return (
          <Chip
            icon={<PresentIcon />}
            label="Present"
            color="success"
            size="small"
          />
        );
      case "late":
        return (
          <Chip
            icon={<LateIcon />}
            label={`Late (${lateMinutes} min)`}
            color="warning"
            size="small"
          />
        );
      case "absent":
        return (
          <Chip
            icon={<AbsentIcon />}
            label="Absent"
            color="error"
            size="small"
          />
        );
      default:
        return <Chip label="Unknown" size="small" />;
    }
  };

  // Prepare data for the pie chart
  const chartData = [
    { name: "Present", value: stats.present, color: COLORS[0] },
    { name: "Late", value: stats.late, color: COLORS[1] },
    { name: "Absent", value: stats.absent, color: COLORS[2] },
  ];

  if (!session) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Attendance for Session on {formatDate(session.session_date)}
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1">
            Session: {formatDate(session.session_date)}
          </Typography>
          <Typography variant="subtitle2">
            Time: {formatTime(session.start_time)} -{" "}
            {formatTime(session.end_time)}
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        ) : attendance.length > 0 ? (
          <>
            {/* Statistics Section */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={7}>
                <Paper sx={{ p: 2, height: "100%" }}>
                  <Typography variant="h6" gutterBottom>
                    Attendance Overview
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value} students`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={5}>
                <Paper sx={{ p: 2, height: "100%" }}>
                  <Typography variant="h6" gutterBottom>
                    Attendance Stats
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                      height: "100%",
                      justifyContent: "center",
                    }}
                  >
                    <Typography variant="body1">
                      Total Students: <strong>{stats.totalStudents}</strong>
                    </Typography>
                    <Typography variant="body1">
                      Present: <strong>{stats.present}</strong> (
                      {((stats.present / stats.totalStudents) * 100).toFixed(1)}
                      %)
                    </Typography>
                    <Typography variant="body1">
                      Late: <strong>{stats.late}</strong> (
                      {((stats.late / stats.totalStudents) * 100).toFixed(1)}%)
                    </Typography>
                    <Typography variant="body1">
                      Absent: <strong>{stats.absent}</strong> (
                      {((stats.absent / stats.totalStudents) * 100).toFixed(1)}
                      %)
                    </Typography>
                    {stats.late > 0 && (
                      <Typography variant="body1">
                        Avg. Late Time:{" "}
                        <strong>{stats.averageLateMinutes} minutes</strong>
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            {/* Students Table */}
            <Typography variant="h6" gutterBottom>
              Student Attendance Records
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Check-in Time</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attendance.map((record) => (
                    <TableRow key={record.student_id}>
                      <TableCell>
                        {record.full_name || record.username}
                      </TableCell>
                      <TableCell>
                        {editingRow === record.student_id ? (
                          <>
                            <Select
                              value={editedStatus}
                              onChange={(e) => setEditedStatus(e.target.value)}
                              size="small"
                              sx={{ minWidth: 100 }}
                            >
                              <MenuItem value="present">Present</MenuItem>
                              <MenuItem value="late">Late</MenuItem>
                              <MenuItem value="absent">Absent</MenuItem>
                            </Select>
                            {editedStatus === "late" && (
                              <TextField
                                type="number"
                                value={editedLateMinutes}
                                onChange={(e) =>
                                  setEditedLateMinutes(Number(e.target.value))
                                }
                                size="small"
                                label="Late (min)"
                                sx={{ width: 80, ml: 1 }}
                              />
                            )}
                            <IconButton
                              onClick={() =>
                                saveAttendanceChange(record.student_id)
                              }
                            >
                              <CheckIcon color="success" />
                            </IconButton>
                            <IconButton onClick={cancelEditing}>
                              <CloseIcon color="error" />
                            </IconButton>
                          </>
                        ) : (
                          getStatusChip(record.status, record.late_minutes)
                        )}
                      </TableCell>
                      <TableCell>
                        {record.check_in_time
                          ? formatTime(record.check_in_time)
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {editingRow === record.student_id ? (
                          <Box>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() =>
                                saveAttendanceChange(record.student_id)
                              }
                            >
                              <SaveIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={cancelEditing}
                            >
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        ) : (
                          <IconButton
                            size="small"
                            onClick={() => startEditing(record)}
                            title="Edit Attendance"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : (
          <Typography color="text.secondary" sx={{ p: 2, textAlign: "center" }}>
            No attendance records for this session
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SessionAttendanceDialog;
