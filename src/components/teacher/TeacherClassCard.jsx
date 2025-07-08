import React from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Button,
  Chip,
} from "@mui/material";
import {
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  Event as SessionsIcon,
} from "@mui/icons-material";

const TeacherClassCard = ({
  classData,
  onManageSessions,
  onViewAttendance,
}) => {
  console.log("CLASSDATA: ", classData);
  return (
    <Card elevation={2}>
      <CardContent>
        <Typography variant="h6" component="div">
          {classData.name}
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          {classData.class_code}
        </Typography>
        {classData.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {classData.description}
          </Typography>
        )}
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <PeopleIcon fontSize="small" color="primary" />
            <Typography variant="body2">
              Students:{" "}
              <Chip
                size="small"
                label={
                  Array.isArray(classData.students)
                    ? classData.students.length
                    : 0
                }
                color={
                  Array.isArray(classData.students) &&
                  classData.students.length > 0
                    ? "primary"
                    : "default"
                }
              />
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SessionsIcon fontSize="small" color="primary" />
            <Typography variant="body2">
              Sessions:{" "}
              <Chip
                size="small"
                label={classData.sessions ? classData.sessions.length : 0}
                color={
                  classData.sessions && classData.sessions.length > 0
                    ? "warning"
                    : "default"
                }
              />
            </Typography>
          </Box>
        </Box>
      </CardContent>
      <CardActions>
        <Button
          size="small"
          color="primary"
          onClick={() => onManageSessions(classData)}
        >
          Manage Sessions
        </Button>
        <Button
          size="small"
          color="secondary"
          onClick={() => onViewAttendance(classData)}
        >
          View Stats
        </Button>
      </CardActions>
    </Card>
  );
};

export default TeacherClassCard;
