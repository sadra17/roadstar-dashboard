// api.js  v9 — complete API client
const BASE   = import.meta.env.VITE_API_URL     || "https://roadstar-api.onrender.com/api";
const SECRET = import.meta.env.VITE_ADMIN_SECRET || "";

export const getToken    = () => localStorage.getItem("roadstar_token") || "";
export const getShopId   = () => { try { const p = JSON.parse(atob(getToken().split(".")[1])); return p.shopId || ""; } catch { return ""; } };
export const getUserRole = () => { try { const p = JSON.parse(atob(getToken().split(".")[1])); return p.role  || ""; } catch { return ""; } };
export const getUserName = () => { try { const p = JSON.parse(atob(getToken().split(".")[1])); return p.name  || ""; } catch { return ""; } };

const h = () => ({
  "Content-Type":   "application/json",
  "Authorization":  `Bearer ${getToken()}`,
  "x-admin-secret": SECRET,
});

async function api(path, opts = {}) {
  const res  = await fetch(`${BASE}${path}`, { headers: h(), ...opts });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `API error ${res.status}`);
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = async (email, password) => {
  const res  = await fetch(`${BASE}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Login failed");
  localStorage.setItem("roadstar_token", data.token);
  return data;
};
export const verifyToken = async () => {
  const res  = await fetch(`${BASE}/auth/verify`, { method: "POST", headers: h() });
  const data = await res.json();
  return data.success === true;
};
export const fetchMe = () => api("/auth/me");
export const logout  = () => api("/auth/logout", { method: "POST" });

// ── Bookings ──────────────────────────────────────────────────────────────────
export const fetchBookings       = (f = {}) => api(`/bookings?${new URLSearchParams(f)}`).then(d => d.bookings);
export const fetchRecentlyDeleted= ()        => api("/recently-deleted").then(d => d.bookings);
export const updateBooking       = (id, u)   => api(`/bookings/${id}`, { method: "PATCH", body: JSON.stringify(u) }).then(d => d.booking);
export const deleteBooking       = (id)      => api(`/bookings/${id}`, { method: "DELETE" });
export const restoreBooking      = (id)      => api(`/bookings/${id}/restore`, { method: "PATCH" }).then(d => d.booking);
export const updatePayment       = (id, u)   => api(`/bookings/${id}/payment`, { method: "PATCH", body: JSON.stringify(u) }).then(d => d.booking);
export const updateMechanic      = (id, u)   => api(`/bookings/${id}/mechanic`, { method: "PATCH", body: JSON.stringify(u) }).then(d => d.booking);
export const extendBay           = (id, min) => api(`/bookings/${id}/extend-bay`, { method: "PATCH", body: JSON.stringify({ minutes: min }) }).then(d => d.booking);
export const baySnooze           = (id)      => api(`/bookings/${id}/bay-snooze`, { method: "PATCH" }).then(d => d.booking);
export const sendSMS             = (id, t)   => api(`/bookings/${id}/sms`, { method: "POST", body: JSON.stringify({ messageType: t }) });

// ── Live Bay ──────────────────────────────────────────────────────────────────
export const fetchLiveBay = () => api("/live-bay");

// ── Customers ─────────────────────────────────────────────────────────────────
export const fetchCustomers    = (search = "") => api(`/customers?search=${encodeURIComponent(search)}`).then(d => d.customers);
export const fetchCustomerByPhone = (phone)    => api(`/customers/by-phone/${encodeURIComponent(phone)}`).then(d => d.customer);
export const exportCustomersCSV   = async () => {
  const res = await fetch(`${BASE}/customers/export`, { headers: h() });
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// ── Analytics ─────────────────────────────────────────────────────────────────
export const fetchAnalyticsSummary   = (p = {}) => api(`/analytics/summary?${new URLSearchParams(p)}`);
export const fetchAnalyticsByDay     = (p = {}) => api(`/analytics/by-day?${new URLSearchParams(p)}`).then(d => d.days);
export const fetchAnalyticsByService = (p = {}) => api(`/analytics/by-service?${new URLSearchParams(p)}`).then(d => d.services);
export const fetchAnalyticsByPayment = (p = {}) => api(`/analytics/by-payment?${new URLSearchParams(p)}`);

// ── Settings ──────────────────────────────────────────────────────────────────
export const fetchSettings    = ()  => api("/settings").then(d => d.settings);
export const updateSettings   = (u) => api("/settings", { method: "PATCH", body: JSON.stringify(u) }).then(d => d.settings);

// ── Users ─────────────────────────────────────────────────────────────────────
export const fetchUsers       = ()        => api("/users").then(d => d.users);
export const createUser       = (u)       => api("/users", { method: "POST", body: JSON.stringify(u) }).then(d => d.user);
export const updateUser       = (id, u)   => api(`/users/${id}`, { method: "PATCH", body: JSON.stringify(u) }).then(d => d.user);
export const deleteUser       = (id)      => api(`/users/${id}`, { method: "DELETE" });
export const resetPassword    = (id, pw)  => api(`/users/${id}/reset-password`, { method: "POST", body: JSON.stringify({ newPassword: pw }) });

// ── Audit Log ─────────────────────────────────────────────────────────────────
export const fetchAuditLog = (p = {}) => api(`/audit-log?${new URLSearchParams(p)}`);

// ── Super Admin — Shops ───────────────────────────────────────────────────────
export const fetchShops   = ()        => api("/admin/shops").then(d => d.shops);
export const createShop   = (s)       => api("/admin/shops", { method: "POST", body: JSON.stringify(s) });
export const updateShop   = (id, u)   => api(`/admin/shops/${id}`, { method: "PATCH", body: JSON.stringify(u) });
export const fetchShopStats=(id)      => api(`/admin/shops/${id}/stats`);
