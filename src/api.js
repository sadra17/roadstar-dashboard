// ─────────────────────────────────────────────────────────────────────────────
// Roadstar API Client v2
// JWT auth + Socket.io support
// ─────────────────────────────────────────────────────────────────────────────

const BASE = import.meta.env.VITE_API_URL || "https://roadstar-api.onrender.com/api";

// ── Token storage ─────────────────────────────────────────────────────────────
export const getToken   = ()    => localStorage.getItem("roadstar_token");
export const setToken   = (t)   => localStorage.setItem("roadstar_token", t);
export const clearToken = ()    => localStorage.removeItem("roadstar_token");

const authHeaders = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${getToken()}`,
});

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = async (email, password) => {
  const res  = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Login failed");
  setToken(data.token);
  return data;
};

export const verifyToken = async () => {
  const token = getToken();
  if (!token) return false;
  try {
    const res = await fetch(`${BASE}/auth/verify`, {
      method: "POST",
      headers: authHeaders(),
    });
    return res.ok;
  } catch {
    return false;
  }
};

export const logout = () => {
  clearToken();
  window.location.reload();
};

// ── Bookings ──────────────────────────────────────────────────────────────────
export const fetchBookings = async (filters = {}) => {
  const q   = new URLSearchParams(filters).toString();
  const res = await fetch(`${BASE}/bookings?${q}`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load bookings");
  return data.bookings;
};

export const updateBooking = async (id, updates) => {
  const res  = await fetch(`${BASE}/bookings/${id}`, {
    method:  "PATCH",
    headers: authHeaders(),
    body:    JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Update failed");
  return data.booking;
};

export const deleteBooking = async (id) => {
  const res  = await fetch(`${BASE}/bookings/${id}`, {
    method:  "DELETE",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Delete failed");
  return data;
};

export const sendSMS = async (id, messageType) => {
  const res  = await fetch(`${BASE}/bookings/${id}/sms`, {
    method:  "POST",
    headers: authHeaders(),
    body:    JSON.stringify({ messageType }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "SMS failed");
  return data;
};
