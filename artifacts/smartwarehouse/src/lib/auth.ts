export const getToken = () => localStorage.getItem("sw_token");
export const setToken = (token: string) => localStorage.setItem("sw_token", token);
export const clearAuth = () => {
  localStorage.removeItem("sw_token");
  localStorage.removeItem("sw_user");
};

export const getUser = () => {
  try {
    const user = localStorage.getItem("sw_user");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};
export const setUser = (user: any) => localStorage.setItem("sw_user", JSON.stringify(user));

export const getAuthHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
