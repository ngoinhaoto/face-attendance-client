import apiService from "./apiService";
import cacheService from "../utils/cacheService";

// Cache utility functions
const getCachedData = (key) => cacheService.get(key);
const setCachedData = (key, data) => cacheService.set(key, data);
const clearCacheKey = (key) => cacheService.invalidate(key);
const clearCachePattern = (prefix) => cacheService.invalidateByPrefix(prefix);
const clearCache = () => cacheService.clear();

// GET operations
const getUsers = async (role = null) => {
  const cacheKey = role ? `users_${role}` : "users";
  const cachedData = getCachedData(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await apiService.get("/users", {
      params: { role },
    });
    const users = response.data || [];
    setCachedData(cacheKey, users);
    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

// Enhanced functions with caching
const getClasses = async (includeDetails = true) => {
  const cacheKey = includeDetails ? "classes_with_details" : "classes";
  const cachedData = getCachedData(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  const response = await apiService.get("/classes", {
    params: {
      include_students: includeDetails,
      include_sessions: includeDetails,
      include_sessions_count: true,
    },
  });

  // If the API doesn't return students/sessions arrays, add empty arrays
  const classes = response.data.map((cls) => ({
    ...cls,
    students: cls.students || [],
    sessions: cls.sessions || [],
  }));

  // If details are requested but not included in response, fetch them
  if (includeDetails) {
    await Promise.all(
      classes.map(async (cls) => {
        // Only fetch students if not already included
        if (!Array.isArray(cls.students) || cls.students.length === 0) {
          cls.students = await getClassStudents(cls.id);
        }

        // Only fetch sessions if not already included
        if (!Array.isArray(cls.sessions) || cls.sessions.length === 0) {
          cls.sessions = await getClassSessions(cls.id);
        }
      }),
    );
  }

  setCachedData(cacheKey, classes);
  return classes;
};

const getClassById = async (classId) => {
  const cacheKey = `class_${classId}`;
  const cachedData = getCachedData(cacheKey);
  if (cachedData) return cachedData;

  try {
    const response = await apiService.get(`/classes/${classId}`);
    setCachedData(cacheKey, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching class ${classId}:`, error);
    throw error;
  }
};

const getClassStudents = async (classId) => {
  const cacheKey = `class_students_${classId}`;
  const cachedData = getCachedData(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await apiService.get(`/classes/${classId}/students`);
    const students = response.data || [];
    setCachedData(cacheKey, students);
    return students;
  } catch (error) {
    console.error(`Error fetching students for class ${classId}:`, error);
    return [];
  }
};

const getClassSessions = async (classId) => {
  const cacheKey = `class_sessions_${classId}`;
  const cachedData = getCachedData(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await apiService.get(`/classes/${classId}/sessions`);
    const sessions = response.data || [];
    setCachedData(cacheKey, sessions);
    return sessions;
  } catch (error) {
    console.error(`Error fetching sessions for class ${classId}:`, error);
    return [];
  }
};

const getSessionAttendance = async (sessionId) => {
  const cacheKey = `attendance_session_${sessionId}`;
  const cachedData = getCachedData(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await apiService.get(`/attendance/sessions/${sessionId}`);
    const attendanceData = response.data || [];
    setCachedData(cacheKey, attendanceData);
    return attendanceData;
  } catch (error) {
    console.error(`Error fetching attendance for session ${sessionId}:`, error);
    throw error;
  }
};

// CREATE operations
const createUser = async (userData) => {
  try {
    const response = await apiService.post("/users", userData);

    // Clear relevant cache entries
    clearCacheKey("users");
    clearCachePattern("users_");

    // If it's a student, they might be added to classes
    if (userData.role === "student") {
      clearCachePattern("class_students_");
    }

    return response.data;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

const createClass = async (classData) => {
  try {
    const response = await apiService.post("/classes", classData);

    // Clear classes cache
    clearCacheKey("classes");
    clearCacheKey("classes_list");
    clearCacheKey("all_classes");

    return response.data;
  } catch (error) {
    console.error("Error creating class:", error);
    throw error;
  }
};

const createClassSession = async (sessionData) => {
  try {
    const response = await apiService.post("/classes/sessions", sessionData);

    // Clear ALL class-related caches to ensure counts update everywhere
    clearCacheKey("classes");
    clearCacheKey("classes_list");
    clearCacheKey("all_classes");

    // Clear specific class cache
    if (sessionData.class_id) {
      clearCachePattern(`class_${sessionData.class_id}`);
    }

    // Clear dashboard data as new sessions affect analytics
    clearCachePattern("dashboard_");

    return response.data;
  } catch (error) {
    console.error("Error creating class session:", error);
    throw error;
  }
};

// DELETE operations
const deleteUser = async (userId) => {
  try {
    const response = await apiService.delete(`/users/${userId}`);

    // Clear relevant caches
    clearCacheKey("users");
    clearCachePattern("users_");
    clearCachePattern(`user_${userId}`);

    clearCachePattern("class_students_");
    clearCachePattern("classes");
    clearCacheKey("classes_list");
    clearCachePattern("dashboard_");
    clearCachePattern("attendance_session_");

    return response.data;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

const deleteClass = async (classId) => {
  try {
    const response = await apiService.delete(`/classes/${classId}`);

    // Clear relevant caches
    clearCacheKey("classes");
    clearCacheKey("classes_list");
    clearCacheKey("all_classes");
    clearCachePattern(`class_${classId}`);

    // Also clear dashboard data
    clearCachePattern("dashboard_");

    return response.data;
  } catch (error) {
    console.error("Error deleting class:", error);
    throw error;
  }
};

const deleteClassSession = async (sessionId) => {
  try {
    // First, get the session to know its class_id
    let classId;
    try {
      const sessionResponse = await apiService.get(
        `/classes/sessions/${sessionId}`,
      );
      classId = sessionResponse.data.class_id;
    } catch (err) {
      console.warn("Couldn't get session details before deletion:", err);
    }

    // Now delete the session
    const response = await apiService.delete(`/classes/sessions/${sessionId}`);

    // Clear specific caches
    clearCacheKey("classes"); // This is critical - clear the main classes cache
    clearCacheKey("classes_list");
    clearCacheKey("all_classes");

    // If we got the class ID, clear its specific cache too
    if (classId) {
      clearCachePattern(`class_${classId}`);
    } else {
      // If we couldn't get the class ID, clear all class-related caches
      clearCachePattern("class_");
    }

    // Also clear dashboard data
    clearCachePattern("dashboard_");

    return response.data;
  } catch (error) {
    console.error("Error deleting class session:", error);
    throw error;
  }
};

// UPDATE operations
const updateUser = async (userId, userData) => {
  try {
    console.log("Sending update for user:", userId, "with data:", userData);
    const response = await apiService.put(`/users/${userId}`, userData);

    // Clear related cache entries when a user is updated
    clearCacheKey("users");
    clearCachePattern("users_");
    clearCachePattern(`user_${userId}`);

    // If it's a student, also clear class student caches
    if (userData.role === "student") {
      clearCachePattern("class_students_");
      clearCachePattern("classes"); // Clear classes cache since it includes student data
      clearCacheKey("classes_list");
    }

    console.log("Update response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error updating user:", error);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }
    throw error;
  }
};

const updateClass = async (classId, classData) => {
  try {
    console.log("Sending update for class:", classId, "with data:", classData);
    const response = await apiService.put(`/classes/${classId}`, classData);
    console.log("Update response:", response.data);

    // Clear all class-related caches
    clearCacheKey("classes");
    clearCacheKey("classes_list");
    clearCacheKey("all_classes");
    clearCachePattern(`class_${classId}`);

    // Clear dashboard data
    clearCachePattern("dashboard_");

    return response.data;
  } catch (error) {
    console.error("Error updating class:", error);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }
    throw error;
  }
};

const updateClassSession = async (sessionId, sessionData) => {
  try {
    const response = await apiService.put(
      `/classes/sessions/${sessionId}`,
      sessionData,
    );

    // Clear all relevant caches
    if (sessionData.class_id) {
      clearCachePattern(`class_${sessionData.class_id}`);
    }

    clearCacheKey("classes");
    clearCacheKey("classes_list");
    clearCacheKey("all_classes");

    // Clear dashboard data
    clearCachePattern("dashboard_");

    return response.data;
  } catch (error) {
    console.error("Error updating class session:", error);
    throw error;
  }
};

// STUDENT-CLASS relationship operations
const addStudentToClass = async (classId, studentId) => {
  try {
    const response = await apiService.post(
      `/classes/${classId}/students/${studentId}`,
    );

    // Clear relevant caches
    clearCachePattern(`class_${classId}`);
    clearCachePattern(`class_students_${classId}`);
    clearCacheKey("classes");
    clearCacheKey("classes_list");
    clearCacheKey("all_classes");

    return response.data;
  } catch (error) {
    console.error("Error adding student to class:", error);
    throw error;
  }
};

const removeStudentFromClass = async (classId, studentId) => {
  try {
    console.log(`Removing student ${studentId} from class ${classId}`);
    const response = await apiService.delete(
      `/classes/${classId}/students/${studentId}`,
    );

    // Clear relevant caches
    clearCachePattern(`class_${classId}`);
    clearCachePattern(`class_students_${classId}`);
    clearCacheKey("classes");
    clearCacheKey("classes_list");
    clearCacheKey("all_classes");

    console.log("Remove student response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error removing student from class:", error);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }
    throw error;
  }
};

// ATTENDANCE operations
const updateAttendanceStatus = async (sessionId, studentId, status) => {
  try {
    const response = await apiService.put(
      `/attendance/sessions/${sessionId}/students/${studentId}`,
      {
        status: status,
      },
    );

    // Clear attendance-related caches
    clearCachePattern(`attendance_session_${sessionId}`);

    // Clear dashboard data since attendance affects statistics
    clearCachePattern("dashboard_");

    return response.data;
  } catch (error) {
    console.error("Error updating attendance status:", error);
    throw error;
  }
};

// Dashboard data
const getDashboardData = async (dateRange) => {
  const cacheKey = `dashboard_${dateRange.startDate}_${dateRange.endDate}`;
  const cachedData = getCachedData(cacheKey);

  if (cachedData) {
    console.log("Using cached dashboard data");
    return cachedData;
  }

  try {
    const response = await apiService.get("/admin/dashboard", {
      params: {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      },
    });

    // Ensure we have all expected fields
    const data = {
      users: response.data?.users || {
        total: 0,
        admins: 0,
        teachers: 0,
        students: 0,
      },
      classes: response.data?.classes || [],
      activityData: response.data?.activityData || [],
      classesWithSizes: response.data?.classesWithSizes || [],
    };

    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    // Return empty structure instead of throwing
    return {
      users: { total: 0, admins: 0, teachers: 0, students: 0 },
      classes: [],
      activityData: [],
      classesWithSizes: [],
    };
  }
};

// Batch operations
const getMultipleSessionsAttendance = async (sessionIds) => {
  if (!sessionIds || sessionIds.length === 0) return {};

  const result = {};

  // Process in batches of 5 to avoid too many parallel requests
  const batchSize = 5;
  for (let i = 0; i < sessionIds.length; i += batchSize) {
    const batch = sessionIds.slice(i, i + batchSize);

    // Create promises for this batch
    const batchPromises = batch.map((sessionId) =>
      getSessionAttendance(sessionId)
        .then((data) => ({ sessionId, data }))
        .catch((error) => ({ sessionId, error })),
    );

    // Execute this batch in parallel
    const batchResults = await Promise.all(batchPromises);

    // Store results
    batchResults.forEach(({ sessionId, data, error }) => {
      if (error) {
        result[sessionId] = { error };
      } else {
        result[sessionId] = data;
      }
    });
  }

  return result;
};

const getSessionAttendanceByClass = async (classId, sessionId) => {
  try {
    const response = await apiService.get(
      `/classes/${classId}/sessions/${sessionId}/attendance`,
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching attendance for class ${classId}, session ${sessionId}:`,
      error,
    );
    throw error; // Throw the error so we can fall back to the other endpoint
  }
};

// Fetch classes with details for dashboard
const fetchClassesWithDetails = async () => {
  const classes = await getClasses(true);

  // Ensure all classes have students and sessions populated
  return classes.map((cls) => ({
    ...cls,
    students: Array.isArray(cls.students) ? cls.students : [],
    sessions: Array.isArray(cls.sessions) ? cls.sessions : [],
  }));
};

// Export all functions
const adminService = {
  // GET operations
  getUsers,
  getClasses,
  getClassStudents,
  getClassSessions,
  getSessionAttendance,
  getClassById,

  // CREATE operations
  createUser,
  createClass,
  createClassSession,

  // UPDATE operations
  updateUser,
  updateClass,
  updateClassSession,
  updateAttendanceStatus,

  // DELETE operations
  deleteUser,
  deleteClass,
  deleteClassSession,

  // STUDENT-CLASS operations
  addStudentToClass,
  removeStudentFromClass,

  // DASHBOARD operations
  getDashboardData,
  getMultipleSessionsAttendance,
  getSessionAttendanceByClass,
  fetchClassesWithDetails,

  // CACHE operations
  clearCache,
  clearCacheKey,
  clearCachePattern,
  getCachedData,
  setCachedData,
};

export default adminService;
