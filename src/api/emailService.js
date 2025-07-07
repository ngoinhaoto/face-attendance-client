import apiService from "./apiService";

/**
 * Request a password reset email
 * @param {string} email - User's email address
 * @returns {Promise<object>} Response from the API
 */
const requestPasswordReset = async (email) => {
  try {
    const response = await apiService.post("/auth/forgot-password", { email });
    return response.data;
  } catch (error) {
    console.error("Error requesting password reset:", error);
    throw error;
  }
};

/**
 * Reset password with a token
 * @param {string} token - Password reset token from email
 * @param {string} newPassword - New password
 * @returns {Promise<object>} Response from the API
 */
const resetPassword = async (token, newPassword) => {
  try {
    const response = await apiService.post("/auth/reset-password", {
      token,
      new_password: newPassword,
    });
    return response.data;
  } catch (error) {
    console.error("Error resetting password:", error);
    throw error;
  }
};

const emailService = {
  requestPasswordReset,
  resetPassword,
};

export default emailService;