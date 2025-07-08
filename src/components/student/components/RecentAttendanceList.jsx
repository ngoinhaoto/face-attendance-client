import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  ButtonGroup,
} from "@mui/material";
import {
  CheckCircle as PresentIcon,
  Warning as LateIcon,
  Cancel as AbsentIcon,
} from "@mui/icons-material";
import { formatDate, formatTime } from "../../../utils/dateUtils";

const RecentAttendanceList = ({ attendance }) => {
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");

  const getStatusChip = (status, lateMinutes = 0) => {
    const s = status?.toLowerCase();
    switch (s) {
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
            label={`Late${lateMinutes ? ` (${lateMinutes} min)` : ""}`}
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
        return <Chip label={status} size="small" />;
    }
  };

  // Sorting logic
  const sortedAttendance = [...attendance].sort((a, b) => {
    if (sortField === "date") {
      const dateA = new Date(a.session_date);
      const dateB = new Date(b.session_date);
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
    } else if (sortField === "status") {
      const statusOrder = { present: 1, late: 2, absent: 3 };
      const sA = statusOrder[a.status?.toLowerCase()] || 99;
      const sB = statusOrder[b.status?.toLowerCase()] || 99;
      return sortDirection === "asc" ? sA - sB : sB - sA;
    }
    return 0;
  });

  return (
    <Paper sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" gutterBottom>
          Recent Attendance
        </Typography>
        <ButtonGroup variant="outlined" size="small">
          <Button
            variant={sortField === "date" ? "contained" : "outlined"}
            onClick={() => {
              setSortField("date");
              setSortDirection(
                sortField === "date" && sortDirection === "asc"
                  ? "desc"
                  : "asc",
              );
            }}
            sx={{ minWidth: 120 }}
          >
            Date{" "}
            {sortField === "date" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
          </Button>
          <Button
            variant={sortField === "status" ? "contained" : "outlined"}
            onClick={() => {
              setSortField("status");
              setSortDirection(
                sortField === "status" && sortDirection === "asc"
                  ? "desc"
                  : "asc",
              );
            }}
            sx={{ minWidth: 120 }}
          >
            Status{" "}
            {sortField === "status"
              ? sortDirection === "asc"
                ? "↑"
                : "↓"
              : ""}
          </Button>
        </ButtonGroup>
      </Box>

      {sortedAttendance.length > 0 ? (
        <List>
          {sortedAttendance.map((record) => {
            const status = record.status?.toLowerCase();
            return (
              <ListItem
                key={record.id}
                divider
                sx={{
                  borderLeft: `6px solid ${
                    status === "present"
                      ? "#4caf50"
                      : status === "late"
                      ? "#ff9800"
                      : status === "absent"
                      ? "#f44336"
                      : "#e0e0e0"
                  }`,
                  backgroundColor:
                    status === "present"
                      ? "#e8f5e9"
                      : status === "late"
                      ? "#fff8e1"
                      : status === "absent"
                      ? "#ffebee"
                      : "inherit",
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body1">
                        {record.class_name} ({record.class_code})
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box
                      sx={{ display: "flex", flexDirection: "column", mt: 0.5 }}
                    >
                      <Typography variant="body2">
                        {formatDate(record.session_date)}
                      </Typography>
                      <Typography variant="body2">
                        {formatTime(record.start_time)} -{" "}
                        {formatTime(record.end_time)}
                      </Typography>
                    </Box>
                  }
                />
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                  }}
                >
                  {getStatusChip(record.status, record.late_minutes)}

                  {record.check_in_time && (
                    <Typography variant="caption" sx={{ mt: 1 }}>
                      Checked in at {formatTime(record.check_in_time)}
                    </Typography>
                  )}
                </Box>
              </ListItem>
            );
          })}
        </List>
      ) : (
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ textAlign: "center", py: 2 }}
        >
          No attendance records yet
        </Typography>
      )}
    </Paper>
  );
};

export default RecentAttendanceList;
