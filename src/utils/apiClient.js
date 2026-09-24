const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Normalized API Error that ensures error.status, error.data, and error.response
 * are always defined and never trigger "Cannot read properties of undefined (reading 'status')".
 */
export class ApiError extends Error {
  constructor(message, status = 0, data = null, originalError = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    // Guaranteed response object compatibility
    this.response = {
      status,
      data
    };
    this.originalError = originalError;
  }
}

/**
 * Robust centralized HTTP request helper.
 * Handles JSON, Blob, network errors, CORS failures, and non-JSON backend responses defensively.
 *
 * @param {string} endpoint
 * @param {Object} options
 * @returns {Promise<any>}
 */
export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('buildiqo_token');
  const headers = {
    ...options.headers
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token && token !== 'undefined' && token !== 'null' && token.trim() !== '') {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });
  } catch (networkErr) {
    // Network failure, DNS resolution error, CORS block, or aborted request
    const message = networkErr?.name === 'AbortError'
      ? 'Request timed out. Please try again.'
      : (networkErr?.message || 'Network error: Unable to reach the server. Please check your connection.');
    throw new ApiError(message, 0, null, networkErr);
  }

  // Handle blob responses (e.g. DXF file downloads)
  if (options.responseType === 'blob') {
    if (!response.ok) {
      let errJson = null;
      try {
        errJson = await response.json();
      } catch {
        errJson = null;
      }
      const errMsg = errJson?.error || errJson?.message || `Download failed with HTTP ${response.status}`;
      throw new ApiError(errMsg, response.status, errJson);
    }
    return await response.blob();
  }

  // Parse JSON or text safely
  const contentType = response.headers?.get('content-type') || '';
  let data = null;

  if (contentType.includes('application/json')) {
    data = await response.json().catch(() => null);
  } else {
    const rawText = await response.text().catch(() => '');
    try {
      data = JSON.parse(rawText);
    } catch {
      data = rawText ? { message: rawText } : null;
    }
  }

  if (!response.ok) {
    let errMsg = data?.error || data?.message || data?.detail;
    if (typeof errMsg === 'object' && errMsg !== null) {
      errMsg = errMsg.message || JSON.stringify(errMsg);
    }
    if (!errMsg || typeof errMsg !== 'string') {
      errMsg = `Request failed with HTTP ${response.status}`;
    }
    throw new ApiError(errMsg, response.status, data);
  }

  return data ?? {};
}
