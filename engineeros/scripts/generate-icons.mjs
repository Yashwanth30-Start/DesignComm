/**
 * Generates public/icons/icon-192.png and icon-512.png for the PWA manifest.
 * Zero image dependencies: rasterizes the app mark (dark rounded square +
 * cyan bolt, matching icon.svg) and writes PNGs with node's zlib.
 *
 * Run: node scripts/generate-icons.mjs
 */
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

// Bolt polygon in the 512-space of icon.svg.
const BOLT = [
  [292, 72],
  [148, 296],
  [240, 296],
  [220, 440],
  [364, 216],
  [272, 216]
];

function pointInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function inRoundedRect(x, y, size, radius) {
  const r = radius;
  const s = size;
  if (x < 0 || y < 0 || x >= s || y >= s) return false;
  const cx = x < r ? r : x > s - r ? s - r : x;
  const cy = y < r ? r : y > s - r ? s - r : y;
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256).map((_, n) => {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      return c;
    });
  }
  let crc = -1;
  for (const b of buf) crc = (crc >>> 8) ^ table[(crc ^ b) & 0xff];
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function writePng(path, size) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  const scale = 512 / size;
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const sx = x * scale;
      const sy = y * scale;
      let rgba = [0, 0, 0, 0];
      if (inRoundedRect(sx, sy, 512, 96)) {
        rgba = [5, 7, 10, 255]; // void background
        if (pointInPolygon(sx, sy, BOLT)) {
          // vertical gradient #6FE3F2 -> #2A7F8C over the bolt's extent
          const t = Math.min(1, Math.max(0, (sy - 72) / (440 - 72)));
          rgba = [
            Math.round(0x6f + (0x2a - 0x6f) * t),
            Math.round(0xe3 + (0x7f - 0xe3) * t),
            Math.round(0xf2 + (0x8c - 0xf2) * t),
            255
          ];
        }
      }
      const off = y * (size * 4 + 1) + 1 + x * 4;
      raw[off] = rgba[0];
      raw[off + 1] = rgba[1];
      raw[off + 2] = rgba[2];
      raw[off + 3] = rgba[3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
  writeFileSync(path, png);
  console.log(`wrote ${path} (${png.length} bytes)`);
}

writePng(join(outDir, "icon-192.png"), 192);
writePng(join(outDir, "icon-512.png"), 512);
