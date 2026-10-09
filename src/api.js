// api.js  v9 — complete API client
const BASE   = import.meta.env.VITE_API_URL     || "https://roadstar-api.onrender.com/api";
const SECRET = import.meta.env.VITE_ADMIN_SECRET || "";

export const getToken = () => localStorage.getItem("roadstar_token") || "";

// FE2: single JWT decode helper — avoids repeating atob/JSON.parse in 3 places
function parseToken() {
  try { return JSON.parse(atob(getToken().split(".")[1])); } catch { return {}; }
}
export const getShopId   = () => parseToken().shopId || "";
export const getUserRole = () => parseToken().role   || "";
export const getUserName = () => parseToken().name   || "";
export const getUserId   = () => parseToken().userId || "";
export const getUserEmail= () => parseToken().email  || "";
// True when the stored JWT's exp claim is in the past (no network needed).
export const isTokenExpired = () => {
  const exp = parseToken().exp;
  return !exp || exp * 1000 <= Date.now();
};

// Readable message from an API error body. Validation errors (422) come back as
// { errors:[{ field, message }] } with no top-level message.
function errMessage(data, status) {
  if (data?.message) return data.message;
  const e = Array.isArray(data?.errors) ? data.errors[0] : null;
  if (e) {
    const msg = e.message || e.msg;
    if (msg && msg !== "Invalid value") return msg;
    if (e.field) return `Please check the ${e.field} field.`;
    if (msg) return msg;
  }
  return `API error ${status}`;
}

const h = () => {
  const headers = {
    "Content-Type":  "application/json",
    "Authorization": `Bearer ${getToken()}`,
  };
  // Only attach x-admin-secret if explicitly configured — avoids triggering the
  // S3 production block that fires whenever this header is present + ADMIN_SECRET is set
  if (SECRET) headers["x-admin-secret"] = SECRET;
  return headers;
};

async function api(path, opts = {}) {
  const res  = await fetch(`${BASE}${path}`, { headers: h(), ...opts });
  // A 429/502 from a proxy may not be JSON — don't turn that into a parse error.
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // FE5: a 401 (expired or rejected token) means the session is over — wipe the
    // token so the next render forces login. 403 (no permission), 429 (rate limit)
    // and 5xx are temporary/other problems and must NOT sign the user out.
    if (res.status === 401) {
      localStorage.removeItem("roadstar_token");
      // Emit a custom event so App.jsx can show a "session expired" banner
      // rather than silently breaking. Falls back to reload if no listener.
      const expired = new CustomEvent("rs:sessionExpired", { detail: { code: data.code, message: data.message } });
      if (!window.dispatchEvent(expired)) window.location.reload();
    }
    throw new Error(errMessage(data, res.status));
  }
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = async (email, password) => {
  const res  = await fetch(`${BASE}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Login failed");
  localStorage.setItem("roadstar_token", data.token);
  return data;
};

// Email OTP login — Step 1: request a 6-digit code
export const requestOtp = async (email) => {
  const res  = await fetch(`${BASE}/auth/request-otp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to send code");
  return data;
};

// Email OTP login — Step 2: verify code, get JWT
export const verifyOtp = async (email, code) => {
  const res  = await fetch(`${BASE}/auth/verify-otp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code }) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Invalid code");
  if (data.token) localStorage.setItem("roadstar_token", data.token);
  return data;
};

// true = valid, false = the server rejected the token (401).
// Anything else (429 rate limit, 5xx, network down) throws, so the caller
// doesn't treat a temporary server problem as being signed out.
export const verifyToken = async () => {
  const res  = await fetch(`${BASE}/auth/verify`, { method: "POST", headers: h() });
  if (res.status === 401) return false;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `API error ${res.status}`);
  return data.success === true;
};
export const fetchMe = () => api("/auth/me");
// Tells the server the user signed out (audit log). Best effort: never throws
// and never fires the session-expired banner, so sign-out always completes.
export const logout  = async () => {
  if (!getToken()) return;
  try { await fetch(`${BASE}/auth/logout`, { method: "POST", headers: h(), keepalive: true }); } catch {}
};

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
export const bayStart            = (id)      => api(`/bookings/${id}/bay-start`, { method: "PATCH" }).then(d => d.booking);
export const bayEnd              = (id)      => api(`/bookings/${id}/bay-end`, { method: "PATCH" });
export const sendSMS             = (id, t)   => api(`/bookings/${id}/sms`, { method: "POST", body: JSON.stringify({ messageType: t }) });
export const saveInspection      = (id, data)  => api(`/bookings/${id}/inspection`, { method: "PATCH", body: JSON.stringify(data) }).then(d => d.booking);
export const emailInspection     = (id, email) => api(`/bookings/${id}/inspection/email`, { method: "POST", body: JSON.stringify(email ? { email } : {}) });

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
  a.download = `customers-${new Date().toLocaleDateString("en-CA")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// ── Analytics ─────────────────────────────────────────────────────────────────
export const fetchAnalyticsSummary   = (p = {}) => api(`/analytics/summary?${new URLSearchParams(p)}`);
export const fetchAnalyticsByDay     = (p = {}) => api(`/analytics/by-day?${new URLSearchParams(p)}`).then(d => d.days);
export const fetchAnalyticsByService = (p = {}) => api(`/analytics/by-service?${new URLSearchParams(p)}`).then(d => d.services);
export const fetchAnalyticsByPayment = (p = {}) => api(`/analytics/by-payment?${new URLSearchParams(p)}`);
export const fetchAnalyticsOverview  = (p = {}) => api(`/analytics/overview?${new URLSearchParams(p)}`);

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
