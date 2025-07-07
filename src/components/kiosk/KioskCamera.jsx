import React, { useState, useEffect } from "react";
import {
  CircularProgress,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Button,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

const KioskCamera = ({
  loadingSession,
  status,
  message,
  videoRef,
  canvasRef,
  streamRef,
  startCamera,
}) => {
  const [cameraRetries, setCameraRetries] = useState(0);
  const [showGuide, setShowGuide] = useState(true);
  const [isReloading, setIsReloading] = useState(false);

  useEffect(() => {
    let timer;
    if (isReloading) {
      timer = setTimeout(() => {
        setIsReloading(false);
      }, 200);
    }
    return () => clearTimeout(timer);
  }, [isReloading]);

  const handleRetryCamera = () => {
    setCameraRetries((prev) => prev + 1);
    setIsReloading(true);
    startCamera();
  };

  return (
    <div className="camera-container-large">
      {loadingSession ? (
        <div className="camera-loading">
          <CircularProgress size={60} />
          <p>Loading session...</p>
        </div>
      ) : (
        <>
          {/* Face positioning guide toggle */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              mb: 1.5,
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={showGuide}
                  onChange={() => setShowGuide(!showGuide)}
                  color="primary"
                  size="medium"
                />
              }
              label={
                <Typography variant="body1">
                  Show face positioning guide
                </Typography>
              }
              sx={{
                "& .MuiFormControlLabel-label": {
                  fontSize: "1rem",
                },
              }}
            />

            {/* Reload Camera Button */}
            <Button
              variant="outlined"
              size="medium"
              startIcon={<RefreshIcon />}
              onClick={handleRetryCamera}
              disabled={isReloading}
              sx={{
                minWidth: "150px",
                height: "40px",
                fontSize: "0.95rem",
                fontWeight: "medium",
              }}
            >
              {isReloading ? "Loading..." : "Reload Camera"}
            </Button>
          </Box>

          <div className={`camera-wrapper-large ${status}`}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`camera-view ${status}`}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            <canvas ref={canvasRef} style={{ display: "none" }} />

            {/* Face positioning guide overlay */}
            {showGuide && status === "scanning" && (
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  pointerEvents: "none",
                  zIndex: 10,
                }}
              >
                {/* Oval face guide */}
                <Box
                  sx={{
                    width: "60%",
                    height: "80%",
                    border: "4px dashed rgba(255, 255, 255, 0.7)",
                    borderRadius: "50%",
                    boxSizing: "border-box",
                    position: "relative",
                  }}
                />

                {/* Center cross marker */}
                <Box
                  sx={{
                    position: "absolute",
                    width: "14px",
                    height: "14px",
                    backgroundColor: "transparent",
                    "&::before, &::after": {
                      content: '""',
                      position: "absolute",
                      backgroundColor: "rgba(255, 255, 255, 0.7)",
                    },
                    "&::before": {
                      width: "14px",
                      height: "3px",
                      top: "5.5px",
                      left: "0",
                    },
                    "&::after": {
                      width: "3px",
                      height: "14px",
                      top: "0",
                      left: "5.5px",
                    },
                  }}
                />

                {/* Guidelines text */}
                <div className="camera-guide-text">
                  Position your face within the oval for check-in
                </div>
              </Box>
            )}

            {/* Only show error overlay if not currently reloading */}
            {!isReloading &&
              (status === "error" ||
                (streamRef.current === null && status === "scanning")) && (
                <div className="camera-error-overlay">
                  <div style={{ textAlign: "center", color: "white" }}>
                    <p style={{ marginBottom: "20px", fontSize: "1.2rem" }}>
                      {status === "error"
                        ? "Error occurred"
                        : "Camera not active or showing black screen"}
                    </p>
                    <button
                      onClick={handleRetryCamera}
                      className="retry-button-large"
                    >
                      Retry Camera{" "}
                      {cameraRetries > 0 ? `(${cameraRetries})` : ""}
                    </button>
                  </div>
                </div>
              )}

            {/* Show loading indicator while reloading */}
            {isReloading && (
              <div className="camera-processing-overlay">
                <CircularProgress size={60} style={{ color: "white" }} />
                <p
                  style={{
                    color: "white",
                    marginTop: "12px",
                    fontSize: "1.2rem",
                  }}
                >
                  Initializing camera...
                </p>
              </div>
            )}

            {/* Status feedback overlay */}
            {status === "processing" && !isReloading && (
              <div className="camera-processing-overlay">
                <CircularProgress size={60} style={{ color: "white" }} />
                <p
                  style={{
                    color: "white",
                    marginTop: "12px",
                    fontSize: "1.2rem",
                  }}
                >
                  Processing...
                </p>
              </div>
            )}

            {status === "success" && (
              <div className="camera-success-overlay">
                <div style={{ textAlign: "center" }}>
                  <div className="success-icon-large">✓</div>
                  <p style={{ fontSize: "1.4rem" }}>Check-in successful!</p>
                </div>
              </div>
            )}
          </div>

          <div className={`status-indicator-large ${status}`}>
            <div className="status-message">
              {isReloading ? "Initializing camera..." : message}
            </div>
            {status === "scanning" &&
              streamRef.current === null &&
              !isReloading && (
                <div className="camera-status">
                  Camera not active - click Reload Camera
                </div>
              )}
          </div>

          {/* Face positioning instructions */}
          {status === "scanning" && (
            <Box
              sx={{
                width: "100%",
                maxWidth: "800px",
                mt: 2,
                p: 3,
                bgcolor: "rgba(25, 118, 210, 0.1)",
                borderRadius: 2,
                border: "1px solid rgba(25, 118, 210, 0.2)",
              }}
            >
              <Typography
                variant="body1"
                component="div"
                sx={{ fontWeight: "medium", mb: 1, fontSize: "1.1rem" }}
              >
                For successful check-in:
              </Typography>
              <Typography variant="body2" component="ul" sx={{ pl: 2, m: 0 }}>
                <li>Look directly at the camera</li>
                <li>Ensure good lighting on your face</li>
                <li>Center your face inside the oval guide</li>
                <li>Keep your entire face visible</li>
                <li>Remove masks, sunglasses, or face coverings</li>
              </Typography>
            </Box>
          )}
        </>
      )}
    </div>
  );
};

export default KioskCamera;
