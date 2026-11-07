// vehicles.js — car makes/models and colors for the walk-in search boxes.
// Staff can still type anything that isn't in the list.

const MODELS = {
  Acura: ["ILX", "Integra", "MDX", "RDX", "TLX", "TSX", "ZDX"],
  "Alfa Romeo": ["Giulia", "Stelvio", "Tonale"],
  Audi: ["A3", "A4", "A5", "A6", "A7", "A8", "e-tron", "Q3", "Q4 e-tron", "Q5", "Q7", "Q8", "S4", "RS5", "TT"],
  BMW: ["2 Series", "3 Series", "4 Series", "5 Series", "7 Series", "i3", "i4", "iX", "M3", "M4", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "Z4"],
  Buick: ["Enclave", "Encore", "Encore GX", "Envista", "Envision", "LaCrosse", "Regal", "Verano"],
  Cadillac: ["ATS", "CT4", "CT5", "CTS", "Escalade", "Lyriq", "SRX", "XT4", "XT5", "XT6"],
  Chevrolet: ["Blazer", "Bolt", "Camaro", "Colorado", "Corvette", "Cruze", "Equinox", "Express", "Impala", "Malibu", "Orlando", "Silverado 1500", "Silverado 2500", "Sonic", "Spark", "Suburban", "Tahoe", "Trailblazer", "Traverse", "Trax", "Volt"],
  Chrysler: ["200", "300", "Grand Caravan", "Pacifica", "Town & Country"],
  Dodge: ["Challenger", "Charger", "Dart", "Durango", "Grand Caravan", "Hornet", "Journey", "Ram 1500"],
  Fiat: ["500", "500X"],
  Ford: ["Bronco", "Bronco Sport", "C-Max", "E-Series", "Edge", "Escape", "Expedition", "Explorer", "F-150", "F-250", "F-350", "Fiesta", "Flex", "Focus", "Fusion", "Maverick", "Mustang", "Mustang Mach-E", "Ranger", "Taurus", "Transit", "Transit Connect"],
  Genesis: ["G70", "G80", "G90", "GV60", "GV70", "GV80"],
  GMC: ["Acadia", "Canyon", "Savana", "Sierra 1500", "Sierra 2500", "Terrain", "Yukon", "Yukon XL"],
  Honda: ["Accord", "Civic", "CR-V", "CR-Z", "Fit", "HR-V", "Insight", "Odyssey", "Passport", "Pilot", "Prologue", "Ridgeline"],
  Hyundai: ["Accent", "Elantra", "Ioniq", "Ioniq 5", "Ioniq 6", "Kona", "Palisade", "Santa Cruz", "Santa Fe", "Sonata", "Tucson", "Veloster", "Venue"],
  Infiniti: ["G37", "Q50", "Q60", "QX50", "QX55", "QX60", "QX80"],
  Jaguar: ["E-Pace", "F-Pace", "F-Type", "I-Pace", "XE", "XF"],
  Jeep: ["Cherokee", "Compass", "Gladiator", "Grand Cherokee", "Grand Wagoneer", "Patriot", "Renegade", "Wagoneer", "Wrangler"],
  Kia: ["Carnival", "EV6", "EV9", "Forte", "K5", "Niro", "Optima", "Rio", "Sedona", "Seltos", "Sorento", "Soul", "Sportage", "Stinger", "Telluride"],
  "Land Rover": ["Defender", "Discovery", "Discovery Sport", "Range Rover", "Range Rover Evoque", "Range Rover Sport", "Range Rover Velar"],
  Lexus: ["ES", "GX", "IS", "LS", "LX", "NX", "RC", "RX", "RZ", "TX", "UX"],
  Lincoln: ["Aviator", "Corsair", "MKC", "MKX", "MKZ", "Nautilus", "Navigator"],
  Mazda: ["CX-3", "CX-30", "CX-5", "CX-50", "CX-70", "CX-9", "CX-90", "Mazda3", "Mazda5", "Mazda6", "MX-5 Miata"],
  "Mercedes-Benz": ["A-Class", "C-Class", "CLA", "E-Class", "EQB", "EQE", "EQS", "G-Class", "GLA", "GLB", "GLC", "GLE", "GLS", "S-Class", "Sprinter"],
  Mini: ["Clubman", "Cooper", "Countryman"],
  Mitsubishi: ["Eclipse Cross", "Lancer", "Mirage", "Outlander", "Outlander PHEV", "RVR"],
  Nissan: ["Altima", "Ariya", "Frontier", "Juke", "Kicks", "Leaf", "Maxima", "Micra", "Murano", "Pathfinder", "Qashqai", "Rogue", "Sentra", "Titan", "Versa"],
  Polestar: ["Polestar 2", "Polestar 3"],
  Porsche: ["911", "Cayenne", "Macan", "Panamera", "Taycan"],
  Ram: ["1500", "2500", "3500", "ProMaster", "ProMaster City"],
  Rivian: ["R1S", "R1T"],
  Subaru: ["Ascent", "BRZ", "Crosstrek", "Forester", "Impreza", "Legacy", "Outback", "Solterra", "WRX"],
  Tesla: ["Cybertruck", "Model 3", "Model S", "Model X", "Model Y"],
  Toyota: ["4Runner", "86", "bZ4X", "C-HR", "Camry", "Corolla", "Corolla Cross", "Grand Highlander", "Highlander", "Matrix", "Mirai", "Prius", "RAV4", "Sequoia", "Sienna", "Supra", "Tacoma", "Tundra", "Venza", "Yaris"],
  Volkswagen: ["Atlas", "Atlas Cross Sport", "Golf", "Golf GTI", "ID.4", "Jetta", "Passat", "Taos", "Tiguan"],
  Volvo: ["C40", "S60", "S90", "V60", "XC40", "XC60", "XC90"],
};

export const CAR_OPTIONS = Object.entries(MODELS).flatMap(([make, models]) => models.map(m => `${make} ${m}`));

export const CAR_COLORS = [
  { name: "White",    hex: "#f5f5f5" },
  { name: "Black",    hex: "#111111" },
  { name: "Grey",     hex: "#7d7f83" },
  { name: "Silver",   hex: "#c0c4c8" },
  { name: "Blue",     hex: "#1f4fbf" },
  { name: "Dark Blue",hex: "#14285a" },
  { name: "Red",      hex: "#c0221f" },
  { name: "Burgundy", hex: "#6b1424" },
  { name: "Green",    hex: "#2e7d32" },
  { name: "Dark Green", hex: "#1b3d2b" },
  { name: "Brown",    hex: "#6d4c35" },
  { name: "Beige",    hex: "#d8c8a8" },
  { name: "Gold",     hex: "#c9a43a" },
  { name: "Orange",   hex: "#e8731a" },
  { name: "Yellow",   hex: "#f2c81b" },
  { name: "Purple",   hex: "#5e3a8c" },
];
export const colorHex = (name) => CAR_COLORS.find(c => c.name.toLowerCase() === String(name || "").trim().toLowerCase())?.hex || null;

// Every typed word must match the start of a word in the option
// ("to" → Toyota..., "toy cam" → Toyota Camry, "cr" → Honda CR-V, Chevrolet Cruze...).
// Options whose first word matches come first.
export function searchOptions(list, query, limit = 60) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);
  const scored = [];
  for (const opt of list) {
    const label = typeof opt === "string" ? opt : opt.name;
    const words = label.toLowerCase().split(/[\s\-.]+/);
    const full  = label.toLowerCase();
    // Also ignore dashes/dots so "f150" finds F-150 and "crv" finds CR-V.
    const squash = s => s.replace(/[^a-z0-9]/g, "");
    const squashedWords = label.toLowerCase().split(/\s+/).map(squash);
    if (!terms.every(t => words.some(w => w.startsWith(t)) || full.startsWith(t) || full.includes(" " + t) || squashedWords.some(w => w.startsWith(squash(t)) && squash(t)))) continue;
    const score = full.startsWith(q) ? 0 : words[0].startsWith(terms[0]) ? 1 : 2;
    scored.push([score, label, opt]);
  }
  scored.sort((a, b) => a[0] - b[0] || a[1].localeCompare(b[1]));
  return scored.slice(0, limit).map(s => s[2]);
}
