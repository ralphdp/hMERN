export const getBackendUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_BACKEND_URL || window.location.origin;
  }
  return `http://localhost:${process.env.REACT_APP_PORT_BACKEND || 5050}`;
}; 