import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Button,
  Divider,
  Chip,
} from "@mui/material";
import { format, parseISO, isToday } from "date-fns";

const TeacherSessionsList = ({ sessions, emptyMessage, upcoming }) => {
  const navigate = useNavigate();

  const formatDate = (dateStr) => {
    try {
      const date = parseISO(dateStr);
      return isToday(date)
        ? `Today, ${format(date, "MMM d")}`
        : format(date, "EEE, MMM d, yyyy");
    } catch (error) {
      return dateStr;
    }
  };

  const formatTime = (dateStr) => {
    try {
      return format(parseISO(dateStr), "h:mm a");
    } catch (error) {
      return dateStr;
    }
  };

  return (
    <Paper elevation={2} sx={{ borderRadius: 2 }}>
      {sessions.length > 0 ? (
        <List>
          {sessions.map((session, index) => (
            <React.Fragment key={session.id}>
              {index > 0 && <Divider />}
              <ListItem
                alignItems="flex-start"
                secondaryAction={
                  upcoming ? (
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() =>
                        navigate(
                          `/dashboard/classes/${session.classId}/sessions/${session.id}`,
                        )
                      }
                    >
                      Manage
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() =>
                        navigate(
                          `/dashboard/classes/${session.classId}/sessions/${session.id}/attendance`,
                        )
                      }
                    >
                      View Attendance
                    </Button>
                  )
                }
              >
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" fontWeight="medium">
                      {session.className} ({session.classCode})
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        {formatDate(session.session_date)}
                      </Typography>
                      {" — "}
                      <Typography component="span" variant="body2">
                        {formatTime(session.start_time)} -{" "}
                        {formatTime(session.end_time)}
                      </Typography>

                      {session.notes && (
                        <Typography
                          component="div"
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          Notes: {session.notes}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Typography>{emptyMessage}</Typography>
        </Box>
      )}
    </Paper>
  );
};

export default TeacherSessionsList;
