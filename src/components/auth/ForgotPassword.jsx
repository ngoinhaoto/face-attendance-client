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
import { Link } from "react-router-dom";
import emailService from "../../api/emailService";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      await emailService.requestPasswordReset(email);
      setSuccess(true);
    } catch (error) {
      setError("An error occurred. Please try again later.");
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
          <Box>
            <Alert severity="success" sx={{ mb: 3 }}>
              If your email is registered in our system, you will receive a password reset link shortly.
            </Alert>
            <Button
              component={Link}
              to="/login"
              fullWidth
              variant="contained"
              color="primary"
            >
              Return to Login
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit}>
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            
            <Typography sx={{ mb: 2 }}>
              Enter your email address and we'll send you a link to reset your password.
            </Typography>
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              sx={{ mb: 3 }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{ mb: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : "Send Reset Link"}
            </Button>
            
            <Button
              component={Link}
              to="/login"
              fullWidth
              variant="text"
              color="primary"
            >
              Back to Login
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ForgotPassword;