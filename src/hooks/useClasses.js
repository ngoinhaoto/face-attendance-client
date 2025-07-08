import { useState, useEffect, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import adminService from "../api/adminService";
import { toast } from "react-toastify";
import { getCachedData, setCachedData } from "../utils/apiCache";

const useClasses = () => {
  const { user } = useSelector((state) => state.auth);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOperationLoading, setIsOperationLoading] = useState(false);

  // Add a request tracking ref to prevent duplicate requests
  const pendingRequests = useRef({});

  // Fetch classes with student data
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
      const requestPromise = adminService.getClasses();
      pendingRequests.current.classes = requestPromise;

      const data = await requestPromise;
      console.log("Initial classes data:", data);

      // Process classes sequentially instead of in parallel
      const classesWithStudents = [];
      for (const cls of data) {
        try {
          console.log(`Fetching students for class ${cls.id}`);
          // Check cache first
          const cacheKey = `class_students_${cls.id}`;
          let students = getCachedData(cacheKey);

          if (!students) {
            // If not in cache, fetch and cache
            students = await adminService.getClassStudents(cls.id);
            setCachedData(cacheKey, students);
          } else {
            console.log(`Using cached students for class ${cls.id}`);
          }

          console.log(`Class ${cls.id} has ${students.length} students`);
          classesWithStudents.push({ ...cls, students });
        } catch (err) {
          console.error(`Error fetching students for class ${cls.id}:`, err);
          classesWithStudents.push({ ...cls, students: [] });
        }
      }

      console.log("Classes with students:", classesWithStudents);
      setClasses(classesWithStudents);
      return classesWithStudents;
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
      await fetchClasses();
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

  const fetchClassesWithDetails = async () => {
    const classes = await adminService.getClasses();
    const classesWithDetails = await Promise.all(
      classes.map(async (cls) => {
        const [students, sessions] = await Promise.all([
          adminService.getClassStudents(cls.id),
          adminService.getClassSessions(cls.id),
        ]);
        return { ...cls, students, sessions };
      }),
    );
    return classesWithDetails;
  };

  // Delete a class
  const deleteClass = async (classId) => {
    setIsOperationLoading(true);
    try {
      await adminService.deleteClass(classId);
      await fetchClasses();
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
    fetchClassesWithDetails,
    getTeacherName,
  };
};

export default useClasses;
