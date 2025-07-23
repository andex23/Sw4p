/**
 * Get the JWT auth token from local storage
 * @returns {string} The JWT token or null if not found
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

/**
 * Set the JWT auth token in local storage
 * @param {string} token - The JWT token to store
 */
export const setAuthToken = (token: string): void => {
  localStorage.setItem('authToken', token);
};

/**
 * Remove the JWT auth token from local storage
 */
export const removeAuthToken = (): void => {
  localStorage.removeItem('authToken');
};

/**
 * Check if the user is authenticated
 * @returns {boolean} True if authenticated, false otherwise
 */
export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  if (!token) return false;

  try {
    // Check if token is expired
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiry = payload.exp * 1000; // Convert to milliseconds
    return expiry > Date.now();
  } catch (error) {
    console.error('Error parsing JWT token:', error);
    return false;
  }
};

/**
 * Get the user's role from the JWT token
 * @returns {string | null} The user's role or null if not found/invalid
 */
export const getUserRole = (): string | null => {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || null;
  } catch (error) {
    console.error('Error parsing JWT token:', error);
    return null;
  }
};

/**
 * Check if the user has admin role
 * @returns {boolean} True if user has admin role, false otherwise
 */
export const isAdmin = (): boolean => {
  const role = getUserRole();
  return role === 'admin';
}; 