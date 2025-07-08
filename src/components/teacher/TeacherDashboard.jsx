import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Chip,
} from "@mui/material";
import {
  School as ClassIcon,
  Group as StudentsIcon,
  Event as SessionsIcon,
  AssignmentTurnedIn as AttendanceIcon,
} from "@mui/icons-material";
import apiService from "../../api/apiService";
import adminService from "../../api/adminService";
import { format, parseISO, isToday, isFuture } from "date-fns";
import TeacherClassCard from "./TeacherClassCard";
import TeacherStatsCards from "./TeacherStatsCards";
import TeacherSessionsList from "./TeacherSessionsList";
import useClasses from "../../hooks/useClasses";
import { getCachedData, setCachedData } from "../../utils/apiCache";
import cacheService from "../../utils/cacheService";
import RefreshIcon from "@mui/icons-material/Refresh";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth); // Add this line to get the user

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [classes, setClasses] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    totalSessions: 0,
    attendanceRate: 0,
  });

  const { fetchClassesWithDetails } = useClasses();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Check cache first
      const cacheKey = `teacher_dashboard_${user.id}`;
      const cachedData = cacheService.get(cacheKey);

      if (cachedData) {
        console.log("Using cached teacher dashboard data");
        setClasses(cachedData.classes);
        setStats(cachedData.stats);
        setUpcomingSessions(cachedData.upcomingSessions);
        setRecentSessions(cachedData.recentSessions);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      // Get classes with students and sessions already populated
      const classesWithDetails = await fetchClassesWithDetails();

      console.log("Classes with details:", classesWithDetails);

      setClasses(classesWithDetails);

      // Calculate statistics and sessions
      if (classesWithDetails.length > 0) {
        const uniqueStudentIds = new Set();
        let allSessions = [];
        let totalAttendance = 0;
        let totalRecords = 0;

        for (const cls of classesWithDetails) {
          // Count unique students
          if (Array.isArray(cls.students)) {
            cls.students.forEach((student) => {
              uniqueStudentIds.add(student.id);
            });
          }

          // Process sessions
          if (Array.isArray(cls.sessions)) {
            const sessions = cls.sessions.map((session) => ({
              ...session,
              className: cls.name,
              classCode: cls.class_code,
              classId: cls.id,
            }));

            allSessions = [...allSessions, ...sessions];

            // Calculate attendance statistics for this class
            for (const session of sessions) {
              try {
                const attendanceResponse =
                  await adminService.getSessionAttendance(session.id);
                if (attendanceResponse && Array.isArray(attendanceResponse)) {
                  attendanceResponse.forEach((record) => {
                    totalRecords++;
                    if (
                      record.status?.toLowerCase() === "present" ||
                      record.status?.toLowerCase() === "late"
                    ) {
                      totalAttendance++;
                    }
                  });
                }
              } catch (err) {
                console.error(
                  `Error fetching attendance for session ${session.id}:`,
                  err,
                );
              }
            }
          }
        }

        // Sort all sessions by date
        const sortedSessions = [...allSessions].sort(
          (a, b) => new Date(b.session_date) - new Date(a.session_date),
        );

        // Upcoming sessions (future dates)
        const now = new Date();
        const upcoming = sortedSessions
          .filter((session) => new Date(session.session_date) > now)
          .slice(0, 7);

        // Recent sessions (past dates)
        const recent = sortedSessions
          .filter((session) => new Date(session.session_date) <= now)
          .slice(0, 7);

        setUpcomingSessions(upcoming);
        setRecentSessions(recent);

        // Update stats
        setStats({
          totalClasses: classesWithDetails.length,
          totalStudents: uniqueStudentIds.size,
          totalSessions: allSessions.length,
          attendanceRate:
            totalRecords > 0 ? (totalAttendance / totalRecords) * 100 : 0,
        });

        // Cache the results
        cacheService.set(cacheKey, {
          classes: classesWithDetails,
          stats: {
            totalClasses: classesWithDetails.length,
            totalStudents: uniqueStudentIds.size,
            totalSessions: allSessions.length,
            attendanceRate:
              totalRecords > 0 ? (totalAttendance / totalRecords) * 100 : 0,
          },
          upcomingSessions: upcoming,
          recentSessions: recent,
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleManageSessions = (classData) => {
    navigate(`/dashboard/classes/${classData.id}/sessions`);
  };

  const handleViewAttendance = (classData) => {
    navigate(`/dashboard/classes/${classData.id}/attendance`);
  };

  const handleRefresh = () => {
    // Clear dashboard caches
    cacheService.invalidateByPrefix("teacher_dashboard_");

    // Re-fetch data
    fetchDashboardData();
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

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold" }}>
        Teacher Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <TeacherStatsCards stats={stats} />

      {/* Classes */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          My Classes
        </Typography>
        <Grid container spacing={3}>
          {classes.length > 0 ? (
            classes.map((cls) => (
              <Grid item xs={12} sm={6} md={4} key={cls.id}>
                <TeacherClassCard
                  classData={cls}
                  onManageSessions={handleManageSessions}
                  onViewAttendance={handleViewAttendance}
                />
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, textAlign: "center" }}>
                <Typography>
                  You don't have any classes assigned yet.
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Upcoming Sessions */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Upcoming Sessions
        </Typography>
        <TeacherSessionsList
          sessions={upcomingSessions}
          emptyMessage="No upcoming sessions scheduled."
          upcoming={true}
        />
      </Box>

      {/* Recent Sessions */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Recent Sessions
        </Typography>
        <TeacherSessionsList
          sessions={recentSessions}
          emptyMessage="No recent sessions."
          upcoming={false}
        />
      </Box>

      {/* Refresh Button */}
      <Button
        onClick={handleRefresh}
        startIcon={<RefreshIcon />}
        size="small"
        variant="contained"
        sx={{ mb: 4 }}
      >
        Refresh
      </Button>
    </Box>
  );
};

export default TeacherDashboard;
