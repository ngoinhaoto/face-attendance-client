import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Paper,
  Grid,
} from "@mui/material";
import adminService from "../../api/adminService";
import { toast } from "react-toastify";
import ClassCard from "./classes/ClassCard";
import AddClassDialog from "./classes/AddClassDialog";
import ClassEditDialog from "./classes/ClassEditDialog";
import ClassDeleteDialog from "./classes/ClassDeleteDialog";
import ClassStudentsDialog from "./classes/ClassStudentsDialog";
import ClassSessionsDialog from "./classes/ClassSessionsDialog";
import ClassStatsDialog from "./classes/ClassStatsDialog";
import ClassAttendanceSummary from "./classes/ClassAttendanceSummary";
import useClasses from "../../hooks/useClasses"; // We'll create this hook
import { format } from "date-fns";
import cacheService from "../../utils/cacheService";

const ClassesList = () => {
  const {
    classes,
    teachers,
    loading,
    fetchClasses,
    createClass,
    updateClass,
    deleteClass,
  } = useClasses();

  const [searchTerm, setSearchTerm] = useState("");

  // Dialog states
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openStudentsDialog, setOpenStudentsDialog] = useState(false);
  const [openSessionsDialog, setOpenSessionsDialog] = useState(false);
  const [openStatsDialog, setOpenStatsDialog] = useState(false);
  const [openAttendanceSummaryDialog, setOpenAttendanceSummaryDialog] =
    useState(false);

  // Selected items
  const [classToEdit, setClassToEdit] = useState(null);
  const [classToDelete, setClassToDelete] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);

  // Dialog handlers
  const handleOpenAddDialog = () => setOpenAddDialog(true);

  const handleOpenEditDialog = (cls) => {
    setClassToEdit(cls);
    setOpenEditDialog(true);
  };

  const handleOpenDeleteDialog = (cls) => {
    setClassToDelete(cls);
    setOpenDeleteDialog(true);
  };

  const handleOpenStudentsDialog = (cls) => {
    setSelectedClass(cls);
    setOpenStudentsDialog(true);
  };

  const handleOpenSessionsDialog = (cls) => {
    setSelectedClass(cls);
    setOpenSessionsDialog(true);
  };

  const handleOpenStatsDialog = (cls) => {
    setSelectedClass(cls);
    setOpenStatsDialog(true);
  };

  const handleOpenAttendanceSummaryDialog = (cls) => {
    setSelectedClass(cls);
    setOpenAttendanceSummaryDialog(true);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredClasses = classes.filter(
    (cls) =>
      cls.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Add cache invalidation when performing operations
  const handleAddClass = async (classData) => {
    const result = await createClass(classData);
    if (result === true) {
      // Clear dashboard caches after class creation
      cacheService.invalidateByPrefix("teacher_dashboard_");
      cacheService.invalidateByPrefix("admin_dashboard_");
    }
    setOpenAddDialog(false);
  };

  const handleEditClass = async (classId, classData) => {
    const result = await updateClass(classId, classData);
    if (result === true) {
      // Clear dashboard caches after class update
      cacheService.invalidateByPrefix("teacher_dashboard_");
      cacheService.invalidateByPrefix("admin_dashboard_");
    }
    setOpenEditDialog(false);
    setClassToEdit(null);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Classes Management
      </Typography>

      <Box sx={{ display: "flex", mb: 3, gap: 2 }}>
        <TextField
          label="Search Classes"
          variant="outlined"
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ flexGrow: 1 }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleOpenAddDialog}
        >
          Add New Class
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredClasses.map((cls) => (
            <Grid item xs={12} sm={6} md={4} key={cls.id}>
              <ClassCard
                classData={cls}
                teachers={teachers}
                onEdit={handleOpenEditDialog}
                onDelete={handleOpenDeleteDialog}
                onManageStudents={handleOpenStudentsDialog}
                onManageSessions={handleOpenSessionsDialog}
                onViewStats={handleOpenStatsDialog}
                onViewAttendanceSummary={handleOpenAttendanceSummaryDialog}
              />
            </Grid>
          ))}
          {filteredClasses.length === 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, textAlign: "center" }}>
                <Typography>No classes found</Typography>
                {searchTerm && (
                  <Typography variant="body2" color="textSecondary">
                    Try changing your search criteria
                  </Typography>
                )}
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Dialogs */}
      <AddClassDialog
        open={openAddDialog}
        teachers={teachers}
        onClose={() => setOpenAddDialog(false)}
        onAddClass={handleAddClass}
        onSuccess={() => fetchClasses()}
      />

      <ClassEditDialog
        open={openEditDialog}
        classData={classToEdit}
        teachers={teachers}
        onClose={() => {
          setOpenEditDialog(false);
          setClassToEdit(null);
        }}
        onUpdateClass={handleEditClass}
      />

      <ClassDeleteDialog
        open={openDeleteDialog}
        classData={classToDelete}
        onClose={() => {
          setOpenDeleteDialog(false);
          setClassToDelete(null);
        }}
        onDelete={deleteClass}
      />

      <ClassStudentsDialog
        open={openStudentsDialog}
        classData={selectedClass}
        onClose={() => {
          setOpenStudentsDialog(false);
          setSelectedClass(null);
        }}
        onUpdate={() => fetchClasses()}
      />

      <ClassSessionsDialog
        open={openSessionsDialog}
        classData={selectedClass}
        onClose={() => {
          setOpenSessionsDialog(false);
          setSelectedClass(null);
        }}
        onUpdate={() => fetchClasses()}
      />

      {openStatsDialog && selectedClass && (
        <ClassStatsDialog
          open={openStatsDialog}
          classData={selectedClass}
          onClose={() => {
            setOpenStatsDialog(false);
            setSelectedClass(null);
          }}
        />
      )}

      {openAttendanceSummaryDialog && selectedClass && (
        <ClassAttendanceSummary
          open={openAttendanceSummaryDialog}
          classData={selectedClass}
          onClose={() => {
            setOpenAttendanceSummaryDialog(false);
            setSelectedClass(null);
          }}
        />
      )}
    </Box>
  );
};

export default ClassesList;
