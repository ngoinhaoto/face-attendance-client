import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import adminService from "../../api/adminService";
import apiService from "../../api/apiService";
import { format, parseISO } from "date-fns";

const COLORS = ["#4CAF50", "#FF9800", "#F44336"];
const ATTENDANCE_STATUSES = ["Present", "Late", "Absent"];

const SessionAttendancePage = () => {
  const { classId, sessionId } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [sessionDetails, setSessionDetails] = useState({});
  const [selectedStatus, setSelectedStatus] = useState("Present");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // First get the session details
        const sessionResponse = await apiService.get(
          `/classes/sessions/${sessionId}`,
        );
        setSessionDetails(sessionResponse.data);

        // Then get the attendance data using the correct endpoint
        try {
          const attendanceResponse = await apiService.get(
            `/classes/${classId}/sessions/${sessionId}/attendance`,
          );
          setAttendanceData(attendanceResponse.data || []);
        } catch (classEndpointError) {
          console.warn(
            "Class-specific endpoint failed, falling back to generic endpoint",
            classEndpointError,
          );

          // Fallback to the generic endpoint
          const fallbackResponse = await adminService.getSessionAttendance(
            sessionId,
          );
          setAttendanceData(fallbackResponse || []);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Error fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classId, sessionId]);

  const handleStatusChange = (event) => {
    setSelectedStatus(event.target.value);
  };

  const filteredAttendance = attendanceData.filter(
    (record) => record.status === selectedStatus,
  );

  const totalStudents = attendanceData.length;
  const presentCount = attendanceData.filter(
    (record) => record.status === "Present",
  ).length;
  const lateCount = attendanceData.filter(
    (record) => record.status === "Late",
  ).length;
  const absentCount = attendanceData.filter(
    (record) => record.status === "Absent",
  ).length;

  const attendanceChartData = [
    { name: "Present", value: presentCount },
    { name: "Late", value: lateCount },
    { name: "Absent", value: absentCount },
  ];

  const fetchAttendance = async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      setError("");

      // Try the class-specific endpoint first
      try {
        const response = await apiService.get(
          `/classes/${classId}/sessions/${sessionId}/attendance`,
        );
        setAttendanceData(response.data || []);
      } catch (classEndpointError) {
        console.warn(
          "Class-specific endpoint failed, falling back to generic endpoint",
          classEndpointError,
        );

        // Fallback to the generic endpoint
        const data = await adminService.getSessionAttendance(sessionId);
        setAttendanceData(data || []);
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      setError("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Session Attendance
      </Typography>
      <Paper elevation={3} style={{ padding: 16 }}>
        <Typography variant="h6" gutterBottom>
          Session Details
        </Typography>
        {sessionDetails ? (
          <>
            <Typography>
              <strong>Class:</strong> {sessionDetails.class_name || "N/A"}
            </Typography>
            <Typography>
              <strong>Date:</strong>{" "}
              {sessionDetails.session_date
                ? format(parseISO(sessionDetails.session_date), "MMMM dd, yyyy")
                : "N/A"}
            </Typography>
            <Typography>
              <strong>Time:</strong>{" "}
              {sessionDetails.start_time
                ? format(parseISO(sessionDetails.start_time), "h:mm a")
                : "N/A"}{" "}
              -{" "}
              {sessionDetails.end_time
                ? format(parseISO(sessionDetails.end_time), "h:mm a")
                : "N/A"}
            </Typography>
            {sessionDetails.notes && (
              <Typography>
                <strong>Notes:</strong> {sessionDetails.notes}
              </Typography>
            )}
          </>
        ) : (
          <Typography color="text.secondary">
            Session details not available
          </Typography>
        )}
      </Paper>
      <Paper elevation={3} style={{ padding: 16, marginTop: 16 }}>
        <Typography variant="h6" gutterBottom>
          Attendance Records
        </Typography>
        <FormControl fullWidth>
          <InputLabel>Status</InputLabel>
          <Select
            value={selectedStatus}
            onChange={handleStatusChange}
            label="Status"
          >
            {ATTENDANCE_STATUSES.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TableContainer component={Paper} style={{ marginTop: 16 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAttendance.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.studentName}</TableCell>
                  <TableCell>
                    <Chip
                      label={record.status}
                      color={
                        record.status === "Present"
                          ? "primary"
                          : record.status === "Late"
                          ? "warning"
                          : "default"
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {format(parseISO(record.date), "MMMM dd, yyyy")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <Paper elevation={3} style={{ padding: 16, marginTop: 16 }}>
        <Typography variant="h6" gutterBottom>
          Attendance Summary
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Paper
              elevation={3}
              style={{
                padding: 16,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Typography variant="h6">Total Students</Typography>
              <Typography variant="h4">{totalStudents}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper
              elevation={3}
              style={{
                padding: 16,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Typography variant="h6">Present</Typography>
              <Typography variant="h4">{presentCount}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper
              elevation={3}
              style={{
                padding: 16,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Typography variant="h6">Late</Typography>
              <Typography variant="h4">{lateCount}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper
              elevation={3}
              style={{
                padding: 16,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Typography variant="h6">Absent</Typography>
              <Typography variant="h4">{absentCount}</Typography>
            </Paper>
          </Grid>
        </Grid>
        <ResponsiveContainer
          width="100%"
          height={300}
          style={{ marginTop: 16 }}
        >
          <PieChart>
            <Pie
              data={attendanceChartData}
              cx="50%"
              cy="50%"
              innerRadius="40%"
              outerRadius="60%"
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
            >
              {attendanceChartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
};

export default SessionAttendancePage;
