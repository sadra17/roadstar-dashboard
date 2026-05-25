// Run once to generate PNG icons from the SVG:
//   node generate-icons.mjs
// Requires: npm install sharp  (one-time, not added to deps)

import sharp from "sharp";
import { readFileSync } from "fs";

const svg = readFileSync("./public/icon.svg");

await sharp(svg).resize(192, 192).png().toFile("./public/icon-192.png");
console.log("✓ public/icon-192.png");

await sharp(svg).resize(512, 512).png().toFile("./public/icon-512.png");
console.log("✓ public/icon-512.png");

console.log("Icons generated. You can delete this script and uninstall sharp.");
