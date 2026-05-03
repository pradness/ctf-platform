export const isTokenValid = (token) => {
  if (!token || typeof token !== 'string') {
    return false;
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    const payload = JSON.parse(atob(parts[1]));
    if (!payload?.exp) {
      return false;
    }

    const nowInSeconds = Math.floor(Date.now() / 1000);
    return payload.exp > nowInSeconds;
  } catch {
    return false;
  }
};

export const getValidToken = () => {
  const token = localStorage.getItem('token');

  if (!isTokenValid(token)) {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    return null;
  }

  return token;
};
