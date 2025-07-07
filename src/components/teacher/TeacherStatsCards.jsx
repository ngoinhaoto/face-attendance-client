import React from "react";
import { Grid, Paper, Typography, Box } from "@mui/material";
import {
  School as ClassIcon,
  People as StudentsIcon,
  Event as SessionsIcon,
  AssignmentTurnedIn as AttendanceIcon,
} from "@mui/icons-material";

const TeacherStatsCards = ({ stats }) => {
  const statsItems = [
    {
      title: "Classes",
      value: stats.totalClasses,
      icon: <ClassIcon sx={{ fontSize: 40 }} />,
      color: "#2196F3",
    },
    {
      title: "Students",
      value: stats.totalStudents,
      icon: <StudentsIcon sx={{ fontSize: 40 }} />,
      color: "#4CAF50",
    },
    {
      title: "Sessions",
      value: stats.totalSessions,
      icon: <SessionsIcon sx={{ fontSize: 40 }} />,
      color: "#FF9800",
    },
    {
      title: "Attendance Rate",
      value: `${stats.attendanceRate}%`,
      icon: <AttendanceIcon sx={{ fontSize: 40 }} />,
      color: "#E91E63",
    },
  ];

  return (
    <Grid container spacing={3}>
      {statsItems.map((item, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              borderTop: `4px solid ${item.color}`,
              borderRadius: 2,
            }}
          >
            <Box sx={{ color: item.color, mb: 1 }}>{item.icon}</Box>
            <Typography
              variant="h4"
              component="div"
              sx={{ fontWeight: "bold" }}
            >
              {item.value}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {item.title}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default TeacherStatsCards;
