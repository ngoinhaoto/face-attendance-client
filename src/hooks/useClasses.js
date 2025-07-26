import { useState, useEffect, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import adminService from "../api/adminService";
import { toast } from "react-toastify";
// import { getCachedData, setCachedData } from "../utils/apiCache"; // These are now part of adminService
import cacheService from "../utils/cacheService"; // Still useful for manual invalidation

const useClasses = () => {
  const { user } = useSelector((state) => state.auth);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOperationLoading, setIsOperationLoading] = useState(false);

  // Add a request tracking ref to prevent duplicate requests
  const pendingRequests = useRef({});

  // Fetch classes with student and session data
  const fetchClasses = useCallback(async () => {
    // Check if there's already a pending request
    if (pendingRequests.current.classes) {
      console.log(
        "Classes fetch already in progress, skipping duplicate request",
      );
      return pendingRequests.current.classes;
    }

    try {
      setLoading(true);

      // Create a promise for this request and store it
      // Call adminService.getClasses with includeDetails = true
      const requestPromise = adminService.getClasses(true); // <--- CHANGE HERE
      pendingRequests.current.classes = requestPromise;

      const data = await requestPromise;
      console.log("Initial classes data (with details):", data);

      setClasses(data);
      return data;
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast.error("Failed to load classes");
      return [];
    } finally {
      setLoading(false);
      // Clear the pending request reference
      delete pendingRequests.current.classes;
    }
  }, []);

  // Fetch teachers
  const fetchTeachers = async () => {
    if (user?.role !== "admin") return;

    try {
      const users = await adminService.getUsers();
      const teachersList = users.filter((user) => user.role === "teacher");
      setTeachers(teachersList);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  // Create a new class
  const createClass = async (classData) => {
    setIsOperationLoading(true);
    try {
      // Format dates for API
      const classDataForApi = {
        ...classData,
        start_time: classData.start_time.toISOString(),
        end_time: classData.end_time.toISOString(),
        teacher_id: parseInt(classData.teacher_id, 10),
      };

      await adminService.createClass(classDataForApi);

      // adminService.createClass already handles its own cache invalidation.
      // These are redundant if adminService is doing its job:
      // cacheService.invalidate("classes");
      // cacheService.invalidate("classes_with_details");
      // cacheService.invalidateByPrefix("admin_dashboard_");
      // cacheService.invalidateByPrefix("teacher_dashboard_"); // No such cache in adminService

      // Refetch classes to update UI (this is correct and necessary)
      await fetchClasses();
      toast.success("Class added successfully!");
      return true;
    } catch (error) {
      console.error("Error adding class:", error);
      const errorMessage =
        error.response?.data?.detail || "Failed to add class";
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsOperationLoading(false);
    }
  };

  // Update a class
  const updateClass = async (classId, classData) => {
    setIsOperationLoading(true);
    try {
      await adminService.updateClass(classId, classData);
      // adminService.updateClass already handles its own cache invalidation.
      await fetchClasses(); // Refetch to update UI
      toast.success("Class updated successfully!");
      return true;
    } catch (error) {
      console.error("Error updating class:", error);
      const errorMessage =
        error.response?.data?.detail || "Failed to update class";
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsOperationLoading(false);
    }
  };

  // This function is redundant if fetchClasses already gets details
  // Unless it's used directly elsewhere and needs its own explicit fetch
  const fetchClassesWithDetails = async () => {
    // If getClasses(true) is used in fetchClasses, this might just call it again
    // Consider if this is still needed or can be removed/simplified.
    const classes = await adminService.getClasses(true); // Ensure it's true here too
    // The mapping logic might not be needed if adminService.getClasses(true)
    // already returns the data in the desired format
    return classes.map((cls) => ({
      ...cls,
      students: Array.isArray(cls.students) ? cls.students : [],
      sessions: Array.isArray(cls.sessions) ? cls.sessions : [],
    }));
  };

  // Delete a class
  const deleteClass = async (classId) => {
    setIsOperationLoading(true);
    try {
      await adminService.deleteClass(classId);
      // adminService.deleteClass already handles its own cache invalidation.
      await fetchClasses(); // Refetch to update UI
      toast.success("Class deleted successfully!");
      return true;
    } catch (error) {
      console.error("Error deleting class:", error);
      toast.error("Failed to delete class");
      return false;
    } finally {
      setIsOperationLoading(false);
    }
  };

  // Format a date for datetime-local input
  const formatDateForInput = (date) => {
    if (!date) return "";
    const d = new Date(date);
    // Format as YYYY-MM-DDThh:mm
    return d.toISOString().slice(0, 16);
  };

  // Get teacher's name by ID or object
  const getTeacherName = (teacherObj, teacherId) => {
    // If we have the full teacher object with name, use it
    if (teacherObj?.full_name || teacherObj?.username) {
      return teacherObj.full_name || teacherObj.username;
    }

    // If we only have the teacher_id, look up the teacher in our teachers array
    if (teacherId) {
      const foundTeacher = teachers.find((t) => t.id === Number(teacherId));
      if (foundTeacher) {
        return foundTeacher.full_name || foundTeacher.username;
      }
    }

    // If no teacher info is available
    return "Not assigned";
  };

  // Initialize data on component mount
  useEffect(() => {
    const initData = async () => {
      await fetchClasses();
      if (user?.role === "admin") {
        await fetchTeachers();
      }
    };

    initData();
  }, [fetchClasses, user]);

  return {
    classes,
    teachers,
    loading,
    isOperationLoading,
    fetchClasses,
    fetchTeachers,
    createClass,
    updateClass,
    deleteClass,
    formatDateForInput,
    fetchClassesWithDetails, // Consider if this is still needed
    getTeacherName,
  };
};

export default useClasses;
