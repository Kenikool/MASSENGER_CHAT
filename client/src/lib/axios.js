import axios from "axios";

// Force the correct backend URL
const BACKEND_URL =import.meta.env.MODE === "development"
    ? "http://localhost:9000/api"
    : "https://massenger-chat.onrender.com";

console.log("Setting axios baseURL to:", BACKEND_URL);

const axiosInstance = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
  timeout: 10000, // 10 second timeout
});

console.log(
  "Axios instance created with baseURL:",
  axiosInstance.defaults.baseURL
);

// Add request interceptor for logging
axiosInstance.interceptors.request.use(
  (config) => {
    const fullUrl = config.baseURL + config.url;
    console.log(`Making ${config.method?.toUpperCase()} request to ${fullUrl}`);

    // Ensure we're not making requests to the wrong port
    if (fullUrl.includes("localhost:5173")) {
      console.error(
        "ERROR: Request is going to frontend port instead of backend!"
      );
      console.error("Expected: https://massenger-chat.onrender.com/, Got:", fullUrl);
    }

    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.code === "ECONNABORTED") {
      console.error("Request timeout");
    } else if (error.response) {
      console.error(
        "Response error:",
        error.response.status,
        error.response.data
      );
    } else if (error.request) {
      console.error("Network error:", error.request);
    } else {
      console.error("Error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
