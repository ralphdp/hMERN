// frontend/src/utils/config.js

export const getBackendUrl = () => {
  if (process.env.NODE_ENV === "production") {
    return process.env.REACT_APP_BACKEND_URL || window.location.origin;
  }
  // Use relative URLs so requests go through the proxy
  return "";
};
