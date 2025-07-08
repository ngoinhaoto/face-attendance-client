import { useState, useEffect } from "react";
import apiService from "../../../api/apiService";

export default function useStudentData(user) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [classes, setClasses] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [stats, setStats] = useState({
    present: 0,
    late: 0,
    absent: 0,
    total: 0,
    attendanceRate: 0,
  });

  useEffect(() => {
    if (!user || !user.id) {
      setError("User information is incomplete. Please try logging in again.");
      setLoading(false);
      return;
    }

    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch classes
      const response = await apiService.get(`/users/${user.id}/classes`);

      if (response.data && Array.isArray(response.data)) {
        setClasses(response.data);

        // Get upcoming sessions
        let allSessions = [];
        for (const cls of response.data) {
          try {
            const sessionsResponse = await apiService.get(
              `/classes/${cls.id}/sessions`,
            );
            if (sessionsResponse.data && Array.isArray(sessionsResponse.data)) {
              const sessions = sessionsResponse.data.map((session) => ({
                ...session,
                className: cls.name,
                classCode: cls.class_code,
              }));
              allSessions = [...allSessions, ...sessions];
            }
          } catch (err) {
            console.error(`Error fetching sessions for class ${cls.id}:`, err);
          }
        }

        // Filter and sort upcoming sessions
        const now = new Date();
        const upcoming = allSessions
          .filter((session) => new Date(session.session_date) >= now)
          .sort((a, b) => new Date(a.session_date) - new Date(b.session_date));

        setUpcomingSessions(upcoming.slice(0, 5));

        // Fetch attendance records
        try {
          const attendanceResponse = await apiService.get(
            `/attendance/student/${user.id}`,
          );
          if (
            attendanceResponse.data &&
            Array.isArray(attendanceResponse.data)
          ) {
            const processedRecords = attendanceResponse.data.map((record) => ({
              ...record,
              student_name:
                record.student_name ||
                record.full_name ||
                user.full_name ||
                user.username,
            }));

            setRecentAttendance(processedRecords.slice(0, 10));

            // Calculate stats
            const presentCount = attendanceResponse.data.filter(
              (record) => record.status?.toLowerCase() === "present",
            ).length;
            const lateCount = attendanceResponse.data.filter(
              (record) => record.status?.toLowerCase() === "late",
            ).length;
            const absentCount = attendanceResponse.data.filter(
              (record) => record.status?.toLowerCase() === "absent",
            ).length;
            const totalRecords = presentCount + lateCount + absentCount;

            setStats({
              present: presentCount,
              late: lateCount,
              absent: absentCount,
              total: totalRecords,
              attendanceRate:
                totalRecords > 0
                  ? (((presentCount + lateCount) / totalRecords) * 100).toFixed(
                      1,
                    )
                  : 0,
            });
          }
        } catch (err) {
          console.error("Error fetching attendance records:", err);
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load your information. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    classes,
    upcomingSessions,
    recentAttendance,
    stats,
    refreshData: fetchDashboardData,
  };
}
