/**
 * Custom fetch wrapper to include JWT for authenticated requests.
 * @param {string} url - The URL to fetch.
 * @param {object} options - Fetch options (method, headers, body, etc.).
 * @returns {Promise<Response>}
 */
export const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  // If the token is expired or invalid, and it's a 401/403, clear token and redirect to login
  if ((response.status === 401 || response.status === 403) && token) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login'; // Redirect to login page
  }

  return response;
};

/**
 * Custom fetch wrapper for file uploads to include JWT.
 * Note: Content-Type header should NOT be set manually for FormData.
 * @param {string} url - The URL to fetch.
 * @param {FormData} formData - The FormData object containing the file.
 * @returns {Promise<Response>}
 */
export const fetchFileWithAuth = async (url, formData) => {
  const token = localStorage.getItem('token');
  const headers = {}; // Content-Type is automatically set by FormData

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: formData,
  });

  // If the token is expired or invalid, and it's a 401/403, clear token and redirect to login
  if ((response.status === 401 || response.status === 403) && token) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login'; // Redirect to login page
  }

  return response;
};
