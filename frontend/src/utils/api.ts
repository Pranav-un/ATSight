// API configuration and helpers
const API_BASE_URL = ""; // Use proxy instead of direct localhost:8080

// Helper to get auth headers
export const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.warn("No auth token found in localStorage");
    console.log("Available localStorage keys:", Object.keys(localStorage));
    return {
      "Content-Type": "application/json",
    };
  }

  console.log("Using auth token:", token.substring(0, 20) + "...");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// Helper for file upload headers
export const getAuthHeadersForUpload = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.warn("No auth token found");
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

// API helper function
export const apiCall = async (
  endpoint: string,
  options: RequestInit = {},
  autoRedirect: boolean = true
) => {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    // Handle authentication errors
    if (response.status === 401 || response.status === 403) {
      console.error(
        `Authentication failed for ${endpoint}. Status: ${response.status}`
      );
      if (autoRedirect) {
        console.error("Auto-redirecting to login...");
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
        window.location.href = "/login";
      }
      throw new Error(`Authentication failed: ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
};

// File upload helper
export const uploadFile = async (
  endpoint: string,
  formData: FormData,
  autoRedirect: boolean = false
) => {
  const url = `${API_BASE_URL}${endpoint}`;

  console.log(`Starting file upload to: ${url}`);
  console.log(
    `FormData entries:`,
    Array.from(formData.entries()).map(([key, value]) => ({
      key,
      type: value instanceof File ? "File" : "String",
      name: value instanceof File ? value.name : value,
      size: value instanceof File ? value.size : undefined,
    }))
  );

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: getAuthHeadersForUpload(),
      body: formData,
    });

    console.log(
      `Upload response received: ${response.status} ${response.statusText}`
    );

    if (response.status === 401 || response.status === 403) {
      console.error(
        `Authentication failed for upload ${endpoint}. Status: ${response.status}`
      );
      if (autoRedirect) {
        console.error("Auto-redirecting to login...");
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
        window.location.href = "/login";
      }
      throw new Error(`Authentication failed: ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error(`File upload failed for ${endpoint}:`, error);
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        `Network error: Unable to connect to server. Please check if the backend is running.`
      );
    }
    throw error;
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem("token");
  console.log("isAuthenticated check:", {
    hasToken: !!token,
    tokenLength: token?.length || 0,
    token: token ? token.substring(0, 20) + "..." : null,
  });
  return !!token;
};

// Debug token
export const debugAuth = () => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("userRole");

  console.log("Auth Debug:", {
    hasToken: !!token,
    tokenLength: token?.length || 0,
    tokenStart: token?.substring(0, 20) + "...",
    tokenEnd: token?.substring(token?.length - 20) || "",
    role: role,
    allLocalStorageKeys: Object.keys(localStorage),
    tokenValue: token, // Full token for debugging
  });

  // Also log the raw token to see if there are any issues
  if (token) {
    console.log("Raw token:", JSON.stringify(token));
  }
};

// Analytics API functions
export const fetchDashboardStats = async () => {
  return apiCall("/api/analytics/dashboard", {}, false);
};

export const fetchFullAnalytics = async (timeRange: string = "30days") => {
  return apiCall(`/api/analytics/full?timeRange=${timeRange}`, {}, false);
};
