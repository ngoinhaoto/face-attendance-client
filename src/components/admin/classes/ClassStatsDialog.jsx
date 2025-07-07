import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { format, parseISO } from "date-fns";
import adminService from "../../../api/adminService";

const COLORS = ["#4caf50", "#ff9800", "#f44336"]; // present, late, absent

const ClassStatsDialog = ({ open, classData, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessions, setSessions] = useState([]);
  const [sessionAttendance, setSessionAttendance] = useState({});
  const [overallStats, setOverallStats] = useState({
    present: 0,
    late: 0,
    absent: 0,
    totalAttendance: 0,
    averageLateMinutes: 0,
  });
  const [studentStats, setStudentStats] = useState([]);
  const [sessionsProcessed, setSessionsProcessed] = useState(0);

  useEffect(() => {
    if (open && classData) {
      fetchData();
    }
  }, [open, classData]);

  // Add batch fetching for attendance data
  const fetchData = async () => {
    if (!classData) return;

    try {
      setLoading(true);
      setError("");
      setSessionsProcessed(0);

      // 1. Get all sessions for this class
      const sessionsData = await adminService.getClassSessions(classData.id);
      setSessions(sessionsData || []);

      // 2. Get all students in this class
      const studentsData = await adminService.getClassStudents(classData.id);

      // 3. Batch request all attendance data instead of one-by-one
      const sessionIds = sessionsData.map((session) => session.id);
      const attendanceData = {};

      // Initialize counters and maps
      let totalPresent = 0;
      let totalLate = 0;
      let totalAbsent = 0;
      let totalLateMinutes = 0;

      // Initialize student stats
      const studentStatsMap = {};
      studentsData.forEach((student) => {
        studentStatsMap[student.id] = {
          id: student.id,
          name: student.full_name || student.username,
          present: 0,
          late: 0,
          absent: 0,
          totalLateMinutes: 0,
          sessions: 0,
          attendanceRate: 0,
        };
      });

      // Process sessions one by one
      for (const session of sessionsData) {
        try {
          // Update progress counter
          setSessionsProcessed((prev) => prev + 1);

          // Get attendance for this session
          const sessionAttendance = await adminService.getSessionAttendance(
            session.id,
          );

          // Store in our data structure
          attendanceData[session.id] = sessionAttendance || [];

          // Process this session's data
          const sessionRecords = sessionAttendance || [];
          sessionRecords.forEach((record) => {
            const status = record.status?.toLowerCase();

            // Update overall counts
            if (status === "present") totalPresent++;
            else if (status === "late") {
              totalLate++;
              totalLateMinutes += record.late_minutes || 0;
            } else if (status === "absent") totalAbsent++;

            // Update student stats
            if (studentStatsMap[record.student_id]) {
              const studentStat = studentStatsMap[record.student_id];
              studentStat.sessions++;

              if (status === "present") studentStat.present++;
              else if (status === "late") {
                studentStat.late++;
                studentStat.totalLateMinutes += record.late_minutes || 0;
              } else if (status === "absent") studentStat.absent++;
            }
          });
        } catch (err) {
          console.error(
            `Error fetching attendance for session ${session.id}:`,
            err,
          );
          // Continue with other sessions even if one fails
        }
      }

      // Calculate attendance rates for students
      Object.values(studentStatsMap).forEach((student) => {
        if (student.sessions > 0) {
          student.attendanceRate = (
            ((student.present + student.late) / student.sessions) *
            100
          ).toFixed(1);
        }
      });

      // Set overall stats
      const totalAttendance = totalPresent + totalLate + totalAbsent;
      setOverallStats({
        present: totalPresent,
        late: totalLate,
        absent: totalAbsent,
        totalAttendance,
        averageLateMinutes:
          totalLate > 0 ? Math.round(totalLateMinutes / totalLate) : 0,
      });

      // Set session attendance data
      setSessionAttendance(attendanceData);

      // Set student stats
      setStudentStats(
        Object.values(studentStatsMap).sort(
          (a, b) => b.attendanceRate - a.attendanceRate,
        ),
      );
    } catch (error) {
      console.error("Error fetching class statistics:", error);
      setError("Failed to load class statistics");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return format(parseISO(dateStr), "MMM d");
    } catch (error) {
      return dateStr;
    }
  };

  // Prepare chart data
  const pieChartData = [
    { name: "Present", value: overallStats.present, color: COLORS[0] },
    { name: "Late", value: overallStats.late, color: COLORS[1] },
    { name: "Absent", value: overallStats.absent, color: COLORS[2] },
  ];

  const sessionChartData = sessions.map((session) => {
    const attendance = sessionAttendance[session.id] || [];
    const present = attendance.filter(
      (a) => a.status?.toLowerCase() === "present",
    ).length;
    const late = attendance.filter(
      (a) => a.status?.toLowerCase() === "late",
    ).length;
    const absent = attendance.filter(
      (a) => a.status?.toLowerCase() === "absent",
    ).length;

    return {
      date: formatDate(session.session_date),
      present,
      late,
      absent,
      total: present + late + absent,
    };
  });

  if (!classData) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Attendance Statistics for {classData.name} ({classData.class_code})
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              p: 3,
            }}
          >
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Loading statistics... {sessionsProcessed}/{sessions.length}{" "}
              sessions processed
            </Typography>
          </Box>
        ) : (
          <>
            {/* Overall Statistics */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={7}>
                <Paper sx={{ p: 2, height: "100%" }}>
                  <Typography variant="h6" gutterBottom>
                    Overall Attendance
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
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
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => `${value} attendance records`}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={5}>
                <Paper sx={{ p: 2, height: "100%" }}>
                  <Typography variant="h6" gutterBottom>
                    Attendance Summary
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
                      Total Attendance Records:{" "}
                      <strong>{overallStats.totalAttendance}</strong>
                    </Typography>
                    <Typography variant="body1">
                      Present: <strong>{overallStats.present}</strong> (
                      {overallStats.totalAttendance > 0
                        ? (
                            (overallStats.present /
                              overallStats.totalAttendance) *
                            100
                          ).toFixed(1)
                        : 0}
                      %)
                    </Typography>
                    <Typography variant="body1">
                      Late: <strong>{overallStats.late}</strong> (
                      {overallStats.totalAttendance > 0
                        ? (
                            (overallStats.late / overallStats.totalAttendance) *
                            100
                          ).toFixed(1)
                        : 0}
                      %)
                    </Typography>
                    <Typography variant="body1">
                      Absent: <strong>{overallStats.absent}</strong> (
                      {overallStats.totalAttendance > 0
                        ? (
                            (overallStats.absent /
                              overallStats.totalAttendance) *
                            100
                          ).toFixed(1)
                        : 0}
                      %)
                    </Typography>
                    {overallStats.late > 0 && (
                      <Typography variant="body1">
                        Average Late Time:{" "}
                        <strong>
                          {overallStats.averageLateMinutes} minutes
                        </strong>
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            {/* Session Attendance Trends */}
            <Paper sx={{ p: 2, mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Attendance Trends by Session
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sessionChartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="present"
                      name="Present"
                      stackId="a"
                      fill={COLORS[0]}
                    />
                    <Bar
                      dataKey="late"
                      name="Late"
                      stackId="a"
                      fill={COLORS[1]}
                    />
                    <Bar
                      dataKey="absent"
                      name="Absent"
                      stackId="a"
                      fill={COLORS[2]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>

            {/* Student Attendance */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Student Attendance Performance
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Student</TableCell>
                      <TableCell align="center">Attendance Rate</TableCell>
                      <TableCell align="center">Present</TableCell>
                      <TableCell align="center">Late</TableCell>
                      <TableCell align="center">Absent</TableCell>
                      <TableCell align="right">Avg. Late (min)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {studentStats.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>{student.name}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${student.attendanceRate}%`}
                            color={
                              student.attendanceRate >= 90
                                ? "success"
                                : student.attendanceRate >= 75
                                ? "primary"
                                : student.attendanceRate >= 60
                                ? "warning"
                                : "error"
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">{student.present}</TableCell>
                        <TableCell align="center">{student.late}</TableCell>
                        <TableCell align="center">{student.absent}</TableCell>
                        <TableCell align="right">
                          {student.late > 0
                            ? Math.round(
                                student.totalLateMinutes / student.late,
                              )
                            : 0}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClassStatsDialog;
