// All env vars in Vite use VITE_ prefix (not REACT_APP_)
const BASE   = import.meta.env.VITE_API_URL    || "https://roadstar-api.onrender.com/api";
const SECRET = import.meta.env.VITE_ADMIN_SECRET || "";

const adminHeaders = {
  "Content-Type":   "application/json",
  "x-admin-secret": SECRET,
};

export const fetchBookings = async (filters = {}) => {
  const q   = new URLSearchParams(filters).toString();
  const res = await fetch(`${BASE}/bookings?${q}`, { headers: adminHeaders });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load bookings");
  return data.bookings;
};

export const updateBooking = async (id, updates) => {
  const res  = await fetch(`${BASE}/bookings/${id}`, {
    method:  "PATCH",
    headers: adminHeaders,
    body:    JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Update failed");
  return data.booking;
};

export const deleteBooking = async (id) => {
  const res  = await fetch(`${BASE}/bookings/${id}`, {
    method:  "DELETE",
    headers: adminHeaders,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Delete failed");
  return data;
};

export const sendSMS = async (id, messageType) => {
  const res  = await fetch(`${BASE}/bookings/${id}/sms`, {
    method:  "POST",
    headers: adminHeaders,
    body:    JSON.stringify({ messageType }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "SMS failed");
  return data;
};
