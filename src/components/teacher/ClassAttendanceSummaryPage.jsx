import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Chip,
  Tooltip,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import adminService from "../../api/adminService";
import { formatDate } from "../../utils/dateUtils";

const COLORS = ["#4caf50", "#ff9800", "#f44336"]; // present, late, absent

const getStatusChip = (status, lateMinutes) => {
  switch (status?.toLowerCase()) {
    case "present":
      return <Chip label="Present" color="success" size="small" />;
    case "late":
      return (
        <Tooltip title={`${lateMinutes || 0} minutes late`}>
          <Chip
            label={`Late${lateMinutes ? ` (${lateMinutes} min)` : ""}`}
            color="warning"
            size="small"
          />
        </Tooltip>
      );
    case "absent":
      return <Chip label="Absent" color="error" size="small" />;
    default:
      return <Chip label="Not Recorded" size="small" variant="outlined" />;
  }
};

const ClassAttendanceSummaryPage = () => {
  const { classId } = useParams();
  const [classData, setClassData] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const cls = await adminService.getClassById(classId);
        setClassData(cls);
        const sessionsData = await adminService.getClassSessions(classId);
        setSessions(sessionsData || []);
        const studentsData = await adminService.getClassStudents(classId);
        setStudents(studentsData || []);
        // Fetch attendance for each session
        const attMap = {};
        for (const session of sessionsData) {
          const sessionAttendance = await adminService.getSessionAttendance(
            session.id,
          );
          const studentAttendanceMap = {};
          sessionAttendance.forEach((record) => {
            studentAttendanceMap[record.student_id] = record;
          });
          attMap[session.id] = studentAttendanceMap;
        }
        setAttendanceMap(attMap);
      } catch (err) {
        setError("Failed to load attendance data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [classId]);

  // Attendance Trends Chart Data
  const sessionChartData = sessions.map((session) => {
    let present = 0,
      late = 0,
      absent = 0;
    students.forEach((student) => {
      const att = attendanceMap[session.id]?.[student.id];
      if (att) {
        if (att.status?.toLowerCase() === "present") present++;
        else if (att.status?.toLowerCase() === "late") late++;
        else if (att.status?.toLowerCase() === "absent") absent++;
      }
    });
    return {
      date: formatDate(session.session_date),
      Present: present,
      Late: late,
      Absent: absent,
    };
  });

  // Helper: get student summary stats
  const getStudentStats = (student) => {
    let present = 0,
      late = 0,
      absent = 0,
      total = 0,
      lateMinutes = 0;
    sessions.forEach((session) => {
      const att = attendanceMap[session.id]?.[student.id];
      if (att) {
        total++;
        if (att.status?.toLowerCase() === "present") present++;
        else if (att.status?.toLowerCase() === "late") {
          late++;
          lateMinutes += att.late_minutes || 0;
        } else if (att.status?.toLowerCase() === "absent") absent++;
      }
    });
    const attendanceRate =
      total > 0 ? (((present + late) / total) * 100).toFixed(1) : "0.0";
    return { present, late, absent, total, lateMinutes, attendanceRate };
  };

  if (loading)
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!classData) return null;

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Attendance Summary for {classData.name} ({classData.class_code})
      </Typography>

      {/* Summary Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h6">Total Students</Typography>
            <Typography variant="h4" color="primary">
              {students.length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h6">Total Sessions</Typography>
            <Typography variant="h4" color="secondary">
              {sessions.length}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Attendance Trends by Session */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Attendance Trends by Session
        </Typography>
        <Box sx={{ height: 340 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sessionChartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Bar dataKey="Present" stackId="a" fill={COLORS[0]} />
              <Bar dataKey="Late" stackId="a" fill={COLORS[1]} />
              <Bar dataKey="Absent" stackId="a" fill={COLORS[2]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      {/* Attendance Table */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Student Attendance Matrix
        </Typography>
        <TableContainer sx={{ maxHeight: 700 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold", minWidth: 180 }}>
                  Student
                </TableCell>
                {sessions.map((session) => (
                  <TableCell
                    key={session.id}
                    align="center"
                    sx={{ minWidth: 100, fontWeight: "bold" }}
                  >
                    <Typography variant="body2" fontWeight="bold">
                      {formatDate(session.session_date)}
                    </Typography>
                  </TableCell>
                ))}
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", minWidth: 160 }}
                >
                  Summary
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((student) => {
                const stats = getStudentStats(student);
                return (
                  <TableRow key={student.id}>
                    <TableCell>
                      <Typography variant="body1">
                        {student.full_name || student.username}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {student.student_id || ""}
                      </Typography>
                    </TableCell>
                    {sessions.map((session) => {
                      const att = attendanceMap[session.id]?.[student.id];
                      return (
                        <TableCell key={session.id + student.id} align="center">
                          {att
                            ? getStatusChip(att.status, att.late_minutes)
                            : getStatusChip()}
                        </TableCell>
                      );
                    })}
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight="bold">
                        {stats.attendanceRate}% Att.
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          gap: 0.5,
                          justifyContent: "center",
                          mt: 0.5,
                        }}
                      >
                        <Chip
                          label={`P: ${stats.present}`}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                        <Chip
                          label={`L: ${stats.late}`}
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                        <Chip
                          label={`A: ${stats.absent}`}
                          size="small"
                          color="error"
                          variant="outlined"
                        />
                      </Box>
                      {stats.late > 0 && (
                        <Typography variant="caption" color="warning.main">
                          {stats.lateMinutes} min late
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default ClassAttendanceSummaryPage;
