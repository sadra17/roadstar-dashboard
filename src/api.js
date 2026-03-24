// api.js  v8
const BASE   = import.meta.env.VITE_API_URL     || "https://roadstar-api.onrender.com/api";
const SECRET = import.meta.env.VITE_ADMIN_SECRET || "";
export const getToken = () => localStorage.getItem("roadstar_token") || "";
const h = () => ({ "Content-Type":"application/json", "Authorization":`Bearer ${getToken()}`, "x-admin-secret":SECRET });

export const fetchBookings = async (filters={}) => {
  const res = await fetch(`${BASE}/bookings?${new URLSearchParams(filters)}`, { headers:h() });
  const d = await res.json(); if (!res.ok) throw new Error(d.message||"Failed"); return d.bookings;
};
export const updateBooking = async (id, updates) => {
  const res = await fetch(`${BASE}/bookings/${id}`, { method:"PATCH", headers:h(), body:JSON.stringify(updates) });
  const d = await res.json(); if (!res.ok) throw new Error(d.message||"Update failed"); return d.booking;
};
export const deleteBooking = async (id) => {
  const res = await fetch(`${BASE}/bookings/${id}`, { method:"DELETE", headers:h() });
  const d = await res.json(); if (!res.ok) throw new Error(d.message||"Delete failed"); return d;
};
export const fetchRecentlyDeleted = async () => {
  const res = await fetch(`${BASE}/recently-deleted`, { headers:h() });
  const d = await res.json(); if (!res.ok) throw new Error(d.message||"Failed"); return d.bookings;
};
export const restoreBooking = async (id) => {
  const res = await fetch(`${BASE}/bookings/${id}/restore`, { method:"PATCH", headers:h() });
  const d = await res.json(); if (!res.ok) throw new Error(d.message||"Restore failed"); return d.booking;
};
export const sendSMS = async (id, messageType) => {
  const res = await fetch(`${BASE}/bookings/${id}/sms`, { method:"POST", headers:h(), body:JSON.stringify({ messageType }) });
  const d = await res.json(); if (!res.ok) throw new Error(d.message||"SMS failed"); return d;
};
export const fetchSettings = async () => {
  const res = await fetch(`${BASE}/settings`, { headers:h() });
  const d = await res.json(); if (!res.ok) throw new Error(d.message||"Failed"); return d.settings;
};
export const updateSettings = async (updates) => {
  const res = await fetch(`${BASE}/settings`, { method:"PATCH", headers:h(), body:JSON.stringify(updates) });
  const d = await res.json(); if (!res.ok) throw new Error(d.message||"Failed"); return d.settings;
};
export const login = async (email, password) => {
  const res = await fetch(`${BASE}/auth/login`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ email, password }) });
  const d = await res.json(); if (!res.ok) throw new Error(d.message||"Login failed");
  localStorage.setItem("roadstar_token", d.token); return d;
};
export const verifyToken = async () => {
  const res = await fetch(`${BASE}/auth/verify`, { headers:h() });
  const d = await res.json(); return d.success===true;
};
