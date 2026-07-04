// Central API base URL configuration
// Reads from VITE_API_BASE_URL environment variable (set in .env)
// For production (Netlify), set this in Netlify Environment Variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://demo-restaurant-v6g2.onrender.com";

export default API_BASE_URL;
