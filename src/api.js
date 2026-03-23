// ─────────────────────────────────────────────────────────────────────────────
// api.js  v7.3
// Dashboard API client — all requests use the admin secret header.
// ─────────────────────────────────────────────────────────────────────────────
const BASE   = import.meta.env.VITE_API_URL     || "https://roadstar-api.onrender.com/api";
const SECRET = import.meta.env.VITE_ADMIN_SECRET || "";

const adminHeaders = {
  "Content-Type":   "application/json",
  "x-admin-secret": SECRET,
};

export const getToken = () => localStorage.getItem("roadstar_token") || "";

const authHeaders = () => ({
  "Content-Type":   "application/json",
  "Authorization":  `Bearer ${getToken()}`,
  "x-admin-secret": SECRET,
});

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

// Soft delete — marks deleted=true, moves to Recently Deleted
export const deleteBooking = async (id) => {
  const res  = await fetch(`${BASE}/bookings/${id}`, {
    method:  "DELETE",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Delete failed");
  return data;
};

// ── Recently Deleted ──────────────────────────────────────────────────────────
export const fetchRecentlyDeleted = async () => {
  const res  = await fetch(`${BASE}/recently-deleted`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load recently deleted");
  return data.bookings;
};

// Restore a soft-deleted booking back to the live system
export const restoreBooking = async (id) => {
  const res  = await fetch(`${BASE}/bookings/${id}/restore`, {
    method:  "PATCH",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Restore failed");
  return data.booking;
};

// ── SMS ───────────────────────────────────────────────────────────────────────
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

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = async (email, password) => {
  const res  = await fetch(`${BASE}/auth/login`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Login failed");
  localStorage.setItem("roadstar_token", data.token);
  return data;
};

export const verifyToken = async () => {
  const res  = await fetch(`${BASE}/auth/verify`, { headers: authHeaders() });
  const data = await res.json();
  return data.success === true;
};
