import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Provider } from "react-redux";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import store from "./store";

// Components
import LoginPage from "./components/auth/LoginPage";
import Dashboard from "./components/shared/Dashboard";
import PrivateRoute from "./components/shared/PrivateRoute";
import AttendanceKiosk from "./components/kiosk/AttendanceKiosk";
import AdminRoute from "./components/shared/routes/AdminRoute";
import ForgotPassword from "./components/auth/ForgotPassword";
import ResetPassword from "./components/auth/ResetPassword";

// Create a custom theme with better aesthetics
const theme = createTheme({
  palette: {
    primary: {
      light: "#4dabf5",
      main: "#2196f3",
      dark: "#1769aa",
      contrastText: "#fff",
    },
    secondary: {
      light: "#f73378",
      main: "#f50057",
      dark: "#ab003c",
      contrastText: "#fff",
    },
    background: {
      default: "#f8f9fa",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: "none",
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          backgroundImage: "linear-gradient(135deg, #2196f3 0%, #0d47a1 100%)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          },
        },
        contained: {
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
          transition: "transform 0.2s, box-shadow 0.2s",
          "&:hover": {
            boxShadow: "0 6px 25px rgba(0,0,0,0.09)",
            transform: "translateY(-2px)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
        },
        elevation1: {
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        },
        elevation4: {
          boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
        },
      },
    },
  },
});

// Create a separate component that uses the router hooks
function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();

  // Add auth state monitoring and kiosk mode check
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const isInKioskMode = sessionStorage.getItem("kioskMode") === "true";

      // If in kiosk mode and trying to navigate away from kiosk paths
      if (isInKioskMode && !location.pathname.includes("/kiosk")) {
        // Force back to kiosk
        navigate("/kiosk", { replace: true });
        return;
      }

      // Normal auth check - if token gone but on protected route
      if (!token && location.pathname.includes("/dashboard")) {
        navigate("/login");
      }
    };

    // Check on mount and when location changes
    checkAuth();

    // Set up listener for storage events
    const handleStorageChange = (e) => {
      if (e.key === "token" && !e.newValue) {
        checkAuth();
      }
      if (e.key === "kioskMode") {
        checkAuth();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Also add a more aggressive navigation blocker for kiosk mode
    const blockNavigation = (e) => {
      const isInKioskMode = sessionStorage.getItem("kioskMode") === "true";
      if (isInKioskMode) {
        // Block navigation attempts
        e.preventDefault();
        // Navigate back to kiosk
        navigate("/kiosk");
      }
    };

    // Listen for popstate events (browser back/forward buttons)
    window.addEventListener("popstate", blockNavigation);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("popstate", blockNavigation);
    };
  }, [location, navigate]);

  return (
    <Routes>
      <Route
        path="/login"
        element={<KioskModeGuard component={<LoginPage />} />}
      />
      <Route
        path="/forgot-password"
        element={<KioskModeGuard component={<ForgotPassword />} />}
      />
      <Route
        path="/reset-password"
        element={<KioskModeGuard component={<ResetPassword />} />}
      />
      <Route
        path="/dashboard/*"
        element={
          <KioskModeGuard
            component={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
        }
      />
      <Route
        path="/kiosk"
        element={
          <AdminRoute>
            <AttendanceKiosk />
          </AdminRoute>
        }
      />
      <Route
        path="/kiosk/class/:classId"
        element={
          <AdminRoute>
            <AttendanceKiosk />
          </AdminRoute>
        }
      />
      <Route
        path="/kiosk/class/:classId/session/:sessionId"
        element={
          <AdminRoute>
            <AttendanceKiosk />
          </AdminRoute>
        }
      />
      <Route
        path="/kiosk/session/:sessionId"
        element={
          <AdminRoute>
            <AttendanceKiosk />
          </AdminRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

// Create a KioskModeGuard component
function KioskModeGuard({ component }) {
  const navigate = useNavigate();
  const isInKioskMode = sessionStorage.getItem("kioskMode") === "true";

  // If in kiosk mode, redirect back to kiosk
  useEffect(() => {
    if (isInKioskMode) {
      navigate("/kiosk", { replace: true });
    }
  }, [isInKioskMode, navigate]);

  // Only render the component if not in kiosk mode
  return isInKioskMode ? null : component;
}

// Main App component that sets up providers
function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
