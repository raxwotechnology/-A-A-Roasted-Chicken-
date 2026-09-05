// Central API base URL configuration
const getApiBaseUrl = () => {
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return "http://localhost:5000";
  }
  return "https://a-a-roasted-chicken.onrender.com";
};

const API_BASE_URL = getApiBaseUrl();

export default API_BASE_URL;

