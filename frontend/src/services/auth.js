import { getBackendUrl } from '../utils/config';

export const verifyEmail = async (token) => {
  const backendUrl = getBackendUrl();
  const response = await fetch(`${backendUrl}/api/auth/verify-email/${token}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    },
    credentials: 'include'
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to verify email');
    } else {
      throw new Error('Failed to verify email');
    }
  }

  return response.json();
}; 