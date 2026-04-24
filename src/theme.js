// theme.js — shared design tokens
// Usage: import { T, applyTheme, getTheme } from './theme.js'
// T is the dark-mode token object (used for inline styles)
// For light/dark switching, use CSS custom properties via applyTheme()

export const DARK = {
  pageBg:       "#07090f",
  sideBg:       "#0a0d15",
  cardBg:       "#0d1120",
  elevated:     "#111827",
  panelBg:      "#0f1422",
  border:       "#1d2b40",
  borderVis:    "#263550",
  blue:         "#2563EB",
  blueHov:      "#3B82F6",
  blueBright:   "#60A5FA",
  blueSubtle:   "#0c1a35",
  blueMuted:    "#172554",
  textPrimary:  "#F0F4FF",
  textSecond:   "#8896B0",
  textMuted:    "#49576a",
  green:        "#22C55E",
  greenBg:      "#071a0f",
  greenBorder:  "#14532D",
  greenText:    "#86EFAC",
  red:          "#EF4444",
  redBg:        "#1a0606",
  redBorder:    "#450a0a",
  redText:      "#FCA5A5",
  amber:        "#F59E0B",
  amberBg:      "#1c1200",
  amberBorder:  "#3d2800",
  amberText:    "#FCD34D",
  teal:         "#14B8A6",
  tealBg:       "#042f2e",
  tealBorder:   "#0f3d3a",
  tealText:     "#5eead4",
  purple:       "#8B5CF6",
  purpleBg:     "#130d24",
  purpleBorder: "#2e1b5e",
  purpleText:   "#C4B5FD",
  orange:       "#F97316",
  orangeBg:     "#1c0d02",
  orangeBorder: "#4a2008",
  orangeText:   "#FDB88A",
  font:         "'Inter',-apple-system,BlinkMacSystemFont,sans-serif",
  r6: "6px", r8: "8px", r10: "10px", r12: "12px", r16: "16px",
  shadow:       "0 1px 3px rgba(0,0,0,.55)",
  shadowLg:     "0 8px 40px rgba(0,0,0,.7)",
};

export const LIGHT = {
  pageBg:       "#f0f2f5",
  sideBg:       "#ffffff",
  cardBg:       "#ffffff",
  elevated:     "#f8f9fc",
  panelBg:      "#ffffff",
  border:       "#e2e8f0",
  borderVis:    "#cbd5e1",
  blue:         "#2563EB",
  blueHov:      "#1d4ed8",
  blueBright:   "#1d4ed8",
  blueSubtle:   "#eff6ff",
  blueMuted:    "#dbeafe",
  textPrimary:  "#0f172a",
  textSecond:   "#475569",
  textMuted:    "#94a3b8",
  green:        "#16a34a",
  greenBg:      "#f0fdf4",
  greenBorder:  "#bbf7d0",
  greenText:    "#15803d",
  red:          "#dc2626",
  redBg:        "#fef2f2",
  redBorder:    "#fecaca",
  redText:      "#dc2626",
  amber:        "#d97706",
  amberBg:      "#fffbeb",
  amberBorder:  "#fde68a",
  amberText:    "#b45309",
  teal:         "#0d9488",
  tealBg:       "#f0fdfa",
  tealBorder:   "#99f6e4",
  tealText:     "#0f766e",
  purple:       "#7c3aed",
  purpleBg:     "#f5f3ff",
  purpleBorder: "#ddd6fe",
  purpleText:   "#6d28d9",
  orange:       "#ea580c",
  orangeBg:     "#fff7ed",
  orangeBorder: "#fed7aa",
  orangeText:   "#c2410c",
  font:         "'Inter',-apple-system,BlinkMacSystemFont,sans-serif",
  r6: "6px", r8: "8px", r10: "10px", r12: "12px", r16: "16px",
  shadow:       "0 1px 3px rgba(0,0,0,.08)",
  shadowLg:     "0 8px 40px rgba(0,0,0,.12)",
};

export function getTheme() {
  return localStorage.getItem("rs_theme") || "dark";
}

export function getT() {
  return getTheme() === "light" ? LIGHT : DARK;
}

export function toggleTheme() {
  const next = getTheme() === "dark" ? "light" : "dark";
  localStorage.setItem("rs_theme", next);
  return next;
}

// Convenience — always export current tokens
export const T = DARK; // components call getT() at render time for live switching

export const STATUS = {
  pending:   { color: DARK.amber,  text: DARK.amberText,  bg: DARK.amberBg,  border: DARK.amberBorder,  label: "Pending"   },
  confirmed: { color: DARK.green,  text: DARK.greenText,  bg: DARK.greenBg,  border: DARK.greenBorder,  label: "Confirmed" },
  waitlist:  { color: DARK.purple, text: DARK.purpleText, bg: DARK.purpleBg, border: DARK.purpleBorder, label: "Waitlist"  },
  completed: { color: DARK.teal,   text: DARK.tealText,   bg: DARK.tealBg,   border: DARK.tealBorder,   label: "Completed" },
  cancelled: { color: DARK.red,    text: DARK.redText,    bg: DARK.redBg,    border: DARK.redBorder,    label: "Cancelled" },
  no_show:   { color: DARK.orange, text: DARK.orangeText, bg: DARK.orangeBg, border: DARK.orangeBorder, label: "No-show"   },
};

export function sm(status) {
  return STATUS[status] || STATUS.pending;
}

export const SVC_DEFS = {
  "Tire Change + Installation": { service_duration: 40, equipment_recovery_time: 0, resourcePool: "bay" },
  "Flat Tire Repair":           { service_duration: 15, equipment_recovery_time: 0, resourcePool: "bay" },
  "Tire Rotation":              { service_duration: 20, equipment_recovery_time: 0, resourcePool: "bay" },
  "Wheel Alignment":            { service_duration: 60, equipment_recovery_time: 0, resourcePool: "alignment" },
  "Tire Purchase":              { service_duration: 10, equipment_recovery_time: 0, resourcePool: "none" },
  "Other":                      { service_duration: 30, equipment_recovery_time: 0, resourcePool: "none" },
};

export function effectiveOcc(b) {
  if (b._resolvedDuration) return b._resolvedDuration;
  const def = SVC_DEFS[b.service] || { service_duration: 30, equipment_recovery_time: 0 };
  const dur = (b.serviceDuration && b.serviceDuration > 10) ? b.serviceDuration : def.service_duration;
  const rec = b.equipmentRecoveryTime !== undefined ? b.equipmentRecoveryTime : def.equipment_recovery_time;
  return dur + rec + (b.bayTimeExtendedBy || 0);
}

export function displaySvc(b) {
  return b.service === "Other" && b.customService ? `Other — ${b.customService}` : b.service;
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function fmtDate(d) {
  if (!d) return "";
  if (d === todayStr()) return "Today";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" });
}
