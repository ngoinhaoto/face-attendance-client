import { useState, useEffect, useCallback } from "react"; // ADDED useCallback
import adminService from "../api/adminService";
import { toast } from "react-toastify";

const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterRole, setFilterRole] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Wrap fetchUsers in useCallback to prevent unnecessary re-runs
  const fetchUsers = useCallback(async () => {
    // <--- ADDED useCallback
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (filterRole) {
        params.role = filterRole;
      }
      const data = await adminService.getUsers(params);
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load users. Please try again later.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [filterRole]); // <--- filterRole is a dependency for this useCallback

  const deleteUser = async (userId) => {
    try {
      await adminService.deleteUser(userId);
      await fetchUsers(); // This will trigger a re-fetch and UI update
      toast.success("User deleted successfully!");
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(error.response?.data?.detail || "Failed to delete user");
      return false;
    }
  };

  const createUser = async (userData) => {
    try {
      const userDataToSend = { ...userData };

      if (userData.role === "student") {
        delete userDataToSend.staff_id;
      } else {
        delete userDataToSend.student_id;
      }

      await adminService.createUser(userDataToSend);
      await fetchUsers(); // This will trigger a re-fetch and UI update
      toast.success("User added successfully!");
      return true;
    } catch (error) {
      console.error("Error creating user:", error);
      const errorMessage = error.response?.data?.detail || "Failed to add user";
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const updateUser = async (userId, userData) => {
    try {
      const userDataToSend = { ...userData };

      if (userData.role === "student") {
        delete userDataToSend.staff_id;
      } else {
        delete userDataToSend.student_id;
      }

      await adminService.updateUser(userId, userDataToSend);
      await fetchUsers(); // This will trigger a re-fetch and UI update
      toast.success("User updated successfully!");
      return true;
    } catch (error) {
      console.error("Error updating user:", error);
      const errorMessage =
        error.response?.data?.detail || "Failed to update user";
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]); // <--- DEPENDENCY CHANGED TO fetchUsers

  const filteredUsers = users.filter(
    (user) =>
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.full_name &&
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const paginatedUsers = filteredUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return {
    users,
    filteredUsers,
    paginatedUsers,
    loading,
    error,
    filterRole,
    searchTerm,
    page,
    rowsPerPage,
    setFilterRole,
    setSearchTerm,
    fetchUsers,
    deleteUser,
    createUser,
    updateUser,
    handleChangePage,
    handleChangeRowsPerPage,
  };
};

export default useUsers;
