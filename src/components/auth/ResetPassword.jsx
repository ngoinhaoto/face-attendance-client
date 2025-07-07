import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Link, useNavigate, useLocation } from "react-router-dom";
import emailService from "../../api/emailService";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (!token) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f5f5",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            maxWidth: 500,
            width: "90%",
            borderRadius: 2,
          }}
        >
          <Typography variant="h5" component="h1" sx={{ mb: 3, textAlign: "center" }}>
            Invalid Reset Link
          </Typography>
          <Alert severity="error" sx={{ mb: 3 }}>
            The password reset link is invalid or has expired.
          </Alert>
          <Button
            component={Link}
            to="/forgot-password"
            fullWidth
            variant="contained"
            color="primary"
          >
            Request New Reset Link
          </Button>
        </Paper>
      </Box>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      await emailService.resetPassword(token, newPassword);
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      setError(error.response?.data?.detail || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f5f5",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 500,
          width: "90%",
          borderRadius: 2,
        }}
      >
        <Typography variant="h5" component="h1" sx={{ mb: 3, textAlign: "center" }}>
          Reset Your Password
        </Typography>
        {success ? (
          <Alert severity="success" sx={{ mb: 3 }}>
            Password reset successful! Redirecting to login...
          </Alert>
        ) : null}
        {error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : null}
        <form onSubmit={handleSubmit}>
          <TextField
            label="New Password"
            type="password"
            variant="outlined"
            fullWidth
            required
            sx={{ mb: 2 }}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <TextField
            label="Confirm Password"
            type="password"
            variant="outlined"
            fullWidth
            required
            sx={{ mb: 2 }}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Reset Password"}
          </Button>
        </form>
        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Typography variant="body2" color="textSecondary">
            Remembered your password?{" "}
            <Button component={Link} to="/login" color="primary">
              Login
            </Button>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default ResetPassword;