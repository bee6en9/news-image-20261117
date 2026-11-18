// generate.mjs — builds entry.png (1024x1024 front page, Tuesday 17 November 2026).
// Node stdlib only (fs + zlib). No external assets, no fonts, no network.
// Every pixel is drawn by hand: a 5x7 bitmap font embedded below, simple
// flat shapes for the six scenes, and a hand-rolled PNG encoder.

import { writeFileSync } from 'node:fs';
import zlib from 'node:zlib';

const W = 1024;
const H = 1024;

// ---------------------------------------------------------------- font 5x7
// Each glyph: 7 rows, each row a 5-bit number (bit 4 = leftmost pixel).
const FONT = {
  ' ': [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
  'A': [0x0E, 0x11, 0x11, 0x1F, 0x11, 0x11, 0x11],
  'B': [0x1E, 0x11, 0x11, 0x1E, 0x11, 0x11, 0x1E],
  'C': [0x0E, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0E],
  'D': [0x1E, 0x11, 0x11, 0x11, 0x11, 0x11, 0x1E],
  'E': [0x1F, 0x10, 0x10, 0x1E, 0x10, 0x10, 0x1F],
  'F': [0x1F, 0x10, 0x10, 0x1E, 0x10, 0x10, 0x10],
  'G': [0x0E, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0F],
  'H': [0x11, 0x11, 0x11, 0x1F, 0x11, 0x11, 0x11],
  'I': [0x0E, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0E],
  'J': [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0C],
  'K': [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11],
  'L': [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1F],
  'M': [0x11, 0x1B, 0x15, 0x15, 0x11, 0x11, 0x11],
  'N': [0x11, 0x19, 0x15, 0x13, 0x11, 0x11, 0x11],
  'O': [0x0E, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0E],
  'P': [0x1E, 0x11, 0x11, 0x1E, 0x10, 0x10, 0x10],
  'Q': [0x0E, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0D],
  'R': [0x1E, 0x11, 0x11, 0x1E, 0x14, 0x12, 0x11],
  'S': [0x0F, 0x10, 0x10, 0x0E, 0x01, 0x01, 0x1E],
  'T': [0x1F, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
  'U': [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0E],
  'V': [0x11, 0x11, 0x11, 0x11, 0x11, 0x0A, 0x04],
  'W': [0x11, 0x11, 0x11, 0x15, 0x15, 0x1B, 0x11],
  'X': [0x11, 0x11, 0x0A, 0x04, 0x0A, 0x11, 0x11],
  'Y': [0x11, 0x11, 0x0A, 0x04, 0x04, 0x04, 0x04],
  'Z': [0x1F, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1F],
  '0': [0x0E, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0E],
  '1': [0x04, 0x0C, 0x04, 0x04, 0x04, 0x04, 0x0E],
  '2': [0x0E, 0x11, 0x01, 0x06, 0x08, 0x10, 0x1F],
  '3': [0x1F, 0x02, 0x04, 0x02, 0x01, 0x11, 0x0E],
  '4': [0x02, 0x06, 0x0A, 0x12, 0x1F, 0x02, 0x02],
  '5': [0x1F, 0x10, 0x1E, 0x01, 0x01, 0x11, 0x0E],
  '6': [0x06, 0x08, 0x10, 0x1E, 0x11, 0x11, 0x0E],
  '7': [0x1F, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
  '8': [0x0E, 0x11, 0x11, 0x0E, 0x11, 0x11, 0x0E],
  '9': [0x0E, 0x11, 0x11, 0x0F, 0x01, 0x02, 0x0C],
  '-': [0x00, 0x00, 0x00, 0x0E, 0x00, 0x00, 0x00],
  '.': [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0C],
  ',': [0x00, 0x00, 0x00, 0x00, 0x00, 0x0C, 0x04],
  ':': [0x00, 0x0C, 0x00, 0x00, 0x00, 0x0C, 0x00],
  '/': [0x01, 0x02, 0x02, 0x04, 0x08, 0x08, 0x10],
  "'": [0x04, 0x04, 0x08, 0x00, 0x00, 0x00, 0x00],
  '(': [0x02, 0x04, 0x08, 0x08, 0x08, 0x04, 0x02],
  ')': [0x08, 0x04, 0x02, 0x02, 0x02, 0x04, 0x08],
  '+': [0x00, 0x04, 0x04, 0x0E, 0x04, 0x04, 0x00],
  '%': [0x19, 0x1A, 0x02, 0x04, 0x08, 0x0B, 0x13],
  '!': [0x04, 0x04, 0x04, 0x04, 0x04, 0x00, 0x04],
  '?': [0x0E, 0x11, 0x01, 0x06, 0x04, 0x00, 0x04],
};

// ---------------------------------------------------------------- canvas
const img = Buffer.alloc(W * H * 4);

function px(x, y, r, g, b) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 4;
  img[i] = r; img[i + 1] = g; img[i + 2] = b; img[i + 3] = 255;
}
function rect(x, y, w, h, r, g, b) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) px(i, j, r, g, b);
}
function circle(cx, cy, rad, r, g, b) {
  for (let j = -rad; j <= rad; j++) for (let i = -rad; i <= rad; i++) {
    if (i * i + j * j <= rad * rad) px(cx + i, cy + j, r, g, b);
  }
}
function ellipse(cx, cy, rx, ry, r, g, b) {
  for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++) {
    if ((i * i) / (rx * rx) + (j * j) / (ry * ry) <= 1) px(cx + i, cy + j, r, g, b);
  }
}
function line(x0, y0, x1, y1, r, g, b) {
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    px(x0, y0, r, g, b);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}
function tri(x0, y0, x1, y1, x2, y2, r, g, b) {
  const minY = Math.min(y0, y1, y2), maxY = Math.max(y0, y1, y2);
  const edges = [[x0, y0, x1, y1], [x1, y1, x2, y2], [x2, y2, x0, y0]];
  for (let y = minY; y <= maxY; y++) {
    const xs = [];
    for (const [ax, ay, bx, by] of edges) {
      if ((ay <= y && by > y) || (by <= y && ay > y)) xs.push(ax + (y - ay) * (bx - ax) / (by - ay));
    }
    if (xs.length >= 2) {
      const a = Math.ceil(Math.min(...xs)), z = Math.floor(Math.max(...xs));
      for (let x = a; x <= z; x++) px(x, y, r, g, b);
    }
  }
}

// ---------------------------------------------------------------- text
function drawChar(ch, x, y, s, col) {
  const g = FONT[ch] || FONT[' '];
  for (let row = 0; row < 7; row++) {
    const bits = g[row];
    for (let c = 0; c < 5; c++) {
      if (bits & (1 << (4 - c))) rect(x + c * s, y + row * s, s, s, ...col);
    }
  }
}
function textWidth(t, s) { return t.length * 6 * s - s; }
function drawText(t, x, y, s, col) {
  let cx = x;
  for (const ch of t) { drawChar(ch, cx, y, s, col); cx += 6 * s; }
}
function drawTextCentered(t, cx, y, s, col) {
  drawText(t, cx - Math.floor(textWidth(t, s) / 2), y, s, col);
}

// ---------------------------------------------------------------- palette
const NAVY = [22, 38, 63];
const GOLD = [201, 162, 39];
const PAPER = [246, 241, 227];
const BAND = [251, 248, 239];
const WHITE = [255, 255, 255];
const SKY = [188, 217, 234];
const WATER = [46, 109, 164];
const STEEL = [70, 74, 80];
const DARK = [52, 56, 62];

// ---------------------------------------------------------------- panels
const PANEL_W = 488, PANEL_H = 271, SCENE_H = 180;

function panel(cx, cy, scene, lines) {
  rect(cx, cy, PANEL_W, PANEL_H, ...NAVY); // border
  const ix = cx + 3, iy = cy + 3, iw = PANEL_W - 6;
  scene(ix, iy, iw, SCENE_H);
  const bandY = cy + 3 + SCENE_H;
  rect(cx + 3, bandY, PANEL_W - 6, PANEL_H - 6 - SCENE_H, ...BAND);
  rect(cx + 3, bandY, PANEL_W - 6, 2, ...NAVY);
  const innerBandY = bandY + 2, bandH = PANEL_H - 6 - SCENE_H - 2;
  if (lines.length === 1) {
    drawTextCentered(lines[0], cx + PANEL_W / 2, innerBandY + Math.floor((bandH - 14) / 2), 2, NAVY);
  } else {
    drawTextCentered(lines[0], cx + PANEL_W / 2, innerBandY + 18, 2, NAVY);
    drawTextCentered(lines[1], cx + PANEL_W / 2, innerBandY + 44, 2, NAVY);
  }
}

// 1 — Crimea Bridge: deck with a blasted gap, smoke and fire over the strait.
function sceneBridge(ix, iy, w, h) {
  rect(ix, iy, w, 105, ...SKY);
  circle(ix + w - 56, iy + 26, 15, 252, 220, 120);
  rect(ix, iy + 105, w, h - 105, ...WATER);
  rect(ix + 40, iy + 128, 70, 4, 255, 255, 255);
  rect(ix + w - 150, iy + 142, 90, 4, 255, 255, 255);
  rect(ix + 200, iy + 156, 60, 4, 255, 255, 255);
  rect(ix + 70, iy + 100, 14, 46, 90, 95, 100);
  rect(ix + w - 84, iy + 100, 14, 46, 90, 95, 100);
  rect(ix, iy + 92, Math.floor(w * 0.42), 10, ...STEEL);
  rect(ix + Math.ceil(w * 0.58), iy + 92, w - Math.ceil(w * 0.58), 10, ...STEEL);
  tri(ix + Math.floor(w * 0.42) - 4, iy + 92, ix + Math.floor(w * 0.42) + 8, iy + 92, ix + Math.floor(w * 0.42) - 2, iy + 116, ...STEEL);
  tri(ix + Math.ceil(w * 0.58) + 4, iy + 92, ix + Math.ceil(w * 0.58) - 8, iy + 92, ix + Math.ceil(w * 0.58) + 2, iy + 116, ...STEEL);
  circle(ix + Math.floor(w / 2), iy + 86, 26, 240, 140, 40);
  circle(ix + Math.floor(w / 2) - 12, iy + 78, 15, 250, 200, 60);
  circle(ix + Math.floor(w / 2) + 14, iy + 80, 13, 250, 200, 60);
  circle(ix + Math.floor(w / 2) - 20, iy + 50, 14, 120, 120, 120);
  circle(ix + Math.floor(w / 2) + 4, iy + 42, 17, 140, 140, 140);
  circle(ix + Math.floor(w / 2) + 24, iy + 54, 12, 120, 120, 120);
}

// 2 — Gaza aid: truck marked AID on a desert road, tents behind it.
function sceneGaza(ix, iy, w, h) {
  rect(ix, iy, w, 70, 245, 230, 190);
  circle(ix + w - 60, iy + 30, 18, 252, 210, 110);
  rect(ix, iy + 70, w, h - 70, 232, 213, 168);
  rect(ix, iy + 128, w, 26, 150, 135, 110);
  tri(ix + 300, iy + 128, ix + 330, iy + 88, ix + 360, iy + 128, 255, 255, 255);
  tri(ix + 366, iy + 128, ix + 392, iy + 96, ix + 418, iy + 128, 230, 220, 200);
  rect(ix + 328, iy + 110, 4, 18, 120, 90, 60);
  rect(ix + 390, iy + 112, 4, 16, 120, 90, 60);
  rect(ix + 52, iy + 84, 124, 52, ...NAVY);
  rect(ix + 56, iy + 88, 116, 44, ...WHITE);
  drawText('AID', ix + 56 + Math.floor((116 - textWidth('AID', 2)) / 2), iy + 100, 2, NAVY);
  rect(ix + 180, iy + 104, 44, 32, 200, 60, 50);
  rect(ix + 190, iy + 110, 16, 12, 180, 220, 240);
  circle(ix + 88, iy + 140, 10, 30, 30, 30);
  circle(ix + 150, iy + 140, 10, 30, 30, 30);
  circle(ix + 202, iy + 140, 10, 30, 30, 30);
}

// 3 — Japan jets: fighter jets racing toward a red sun disc.
function sceneJets(ix, iy, w, h) {
  rect(ix, iy, w, h, 168, 200, 224);
  ellipse(ix + 90, iy + 40, 46, 14, ...WHITE);
  ellipse(ix + 330, iy + 130, 54, 16, ...WHITE);
  ellipse(ix + 400, iy + 52, 40, 12, ...WHITE);
  circle(ix + w - 70, iy + 42, 26, 200, 40, 40);
  circle(ix + w - 122, iy + 66, 5, 180, 30, 30);
  rect(ix + 90, iy + 86, 60, 3, ...WHITE);
  rect(ix + 70, iy + 100, 50, 3, ...WHITE);
  rect(ix + 100, iy + 112, 44, 3, ...WHITE);
  tri(ix + 170, iy + 92, ix + 292, iy + 84, ix + 292, iy + 100, ...DARK);
  tri(ix + 186, iy + 92, ix + 206, iy + 62, ix + 216, iy + 92, ...DARK);
  tri(ix + 216, iy + 94, ix + 252, iy + 120, ix + 236, iy + 92, 70, 74, 80);
  circle(ix + 262, iy + 92, 5, 180, 220, 240);
  tri(ix + 84, iy + 132, ix + 148, iy + 126, ix + 148, iy + 138, 90, 95, 100);
  tri(ix + 96, iy + 132, ix + 110, iy + 112, ix + 116, iy + 132, 90, 95, 100);
  tri(ix + 120, iy + 56, ix + 184, iy + 50, ix + 184, iy + 62, 90, 95, 100);
  tri(ix + 132, iy + 56, ix + 146, iy + 36, ix + 152, iy + 56, 90, 95, 100);
}

// 4 — Paris court: courthouse with columns, pediment and a French flag.
function sceneCourt(ix, iy, w, h) {
  rect(ix, iy, w, h, 210, 225, 235);
  rect(ix + 70, iy + 52, w - 140, 110, 200, 198, 190);
  tri(ix + 70, iy + 52, ix + Math.floor(w / 2), iy + 18, ix + w - 70, iy + 52, 180, 176, 168);
  line(ix + Math.floor(w / 2), iy + 18, ix + Math.floor(w / 2), iy + 2, 90, 90, 90);
  rect(ix + Math.floor(w / 2), iy + 2, 8, 12, 0, 85, 164);
  rect(ix + Math.floor(w / 2) + 8, iy + 2, 8, 12, ...WHITE);
  rect(ix + Math.floor(w / 2) + 16, iy + 2, 8, 12, 239, 65, 53);
  for (const cx of [100, 180, w - 196, w - 116]) rect(ix + cx, iy + 64, 16, 88, ...WHITE);
  rect(ix + Math.floor(w / 2) - 18, iy + 120, 36, 42, 60, 60, 66);
  rect(ix + 60, iy + 162, w - 120, 6, 150, 148, 142);
  rect(ix + 50, iy + 168, w - 100, 6, 140, 138, 132);
}

// 5 — Measles: red spiky virus shapes on a pale background.
function virus(cx, cy, rad, r, g, b) {
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4;
    const x1 = Math.round(cx + Math.cos(a) * rad), y1 = Math.round(cy + Math.sin(a) * rad);
    const x2 = Math.round(cx + Math.cos(a) * (rad + 12)), y2 = Math.round(cy + Math.sin(a) * (rad + 12));
    line(x1, y1, x2, y2, 160, 30, 30);
    circle(x2, y2, 5, 160, 30, 30);
  }
  circle(cx, cy, rad, r, g, b);
  circle(cx - Math.floor(rad / 3), cy - Math.floor(rad / 3), Math.floor(rad / 4), 255, 255, 255);
}
function sceneMeasles(ix, iy, w, h) {
  rect(ix, iy, w, h, 250, 246, 236);
  virus(ix + 130, iy + 90, 36, 200, 50, 45);
  virus(ix + 330, iy + 66, 26, 220, 70, 60);
  virus(ix + 384, iy + 134, 18, 230, 90, 80);
  circle(ix + 60, iy + 40, 6, 220, 70, 60);
  circle(ix + 250, iy + 36, 5, 230, 90, 80);
  circle(ix + 420, iy + 44, 6, 220, 70, 60);
  circle(ix + 230, iy + 150, 5, 230, 90, 80);
  circle(ix + 60, iy + 140, 6, 220, 70, 60);
}

// 6 — France protests: crowd of heads and placards above a street.
function sceneProtest(ix, iy, w, h) {
  rect(ix, iy, w, 110, 200, 215, 230);
  rect(ix, iy + 110, w, h - 110, 120, 120, 125);
  const heads = [240, 200, 160, 200, 150, 110, 90, 60, 40, 230, 190, 150];
  const skins = [[240, 200, 160], [200, 150, 110], [90, 60, 40], [230, 190, 150], [60, 60, 70]];
  const shirts = [[200, 60, 50], [50, 100, 180], [240, 200, 60], [60, 160, 80], [180, 80, 160]];
  for (let row = 0; row < 2; row++) {
    const y = iy + (row === 0 ? 88 : 122);
    for (let k = 0; k < 10; k++) {
      const x = ix + 34 + k * 46 + (row === 0 ? 0 : 23);
      const s = skins[(k + row * 2) % skins.length];
      const t = shirts[(k + row) % shirts.length];
      rect(x - 15, y + 12, 30, 46, ...t);
      circle(x, y, 13, ...s);
      circle(x, y - 4, 13, ...[heads[(k * 3 + row) % heads.length], 60, 50]);
    }
  }
  const placards = [
    [55, 'VIE CHERE'],
    [205, 'SALAIRES'],
    [355, 'GREVE'],
  ];
  for (const [px, word] of placards) {
    line(ix + px + 35, iy + 32, ix + px + 35, iy + 62, 120, 90, 60);
    rect(ix + px, iy + 4, 70, 28, ...NAVY);
    rect(ix + px + 2, iy + 6, 66, 24, ...WHITE);
    drawText(word, ix + px + 2 + Math.floor((66 - textWidth(word, 1)) / 2), iy + 13, 1, NAVY);
  }
}

// ---------------------------------------------------------------- compose
rect(0, 0, W, H, ...PAPER);

// Masthead.
rect(0, 0, W, 150, ...NAVY);
drawTextCentered('THE WORLD TODAY', Math.floor(W / 2), 20, 5, WHITE);
drawTextCentered('TUESDAY 17 NOVEMBER 2026', Math.floor(W / 2), 70, 3, GOLD);
rect(24, 108, W - 48, 3, ...GOLD);
drawTextCentered('SIX STORIES FROM AROUND THE GLOBE', Math.floor(W / 2), 122, 2, [220, 225, 235]);

// Six panels, two columns by three rows.
const cols = [16, 520];
const rows = [166, 451, 736];
panel(cols[0], rows[0], sceneBridge, ['UKRAINE HITS', 'CRIMEA BRIDGE']);
panel(cols[1], rows[0], sceneGaza, ['NATIONS URGE', 'GAZA AID ACCESS']);
panel(cols[0], rows[1], sceneJets, ['JAPAN SCRAMBLES JETS', 'AFTER AIRSPACE BREACH']);
panel(cols[1], rows[1], sceneCourt, ['DEPARDIEU PLEADS', 'GUILTY IN PARIS']);
panel(cols[0], rows[2], sceneMeasles, ['US LOSES MEASLES', 'FREE STATUS']);
panel(cols[1], rows[2], sceneProtest, ['146,000 PROTEST', 'IN FRANCE']);

// Thin navy frame around the whole page.
rect(0, 0, W, 6, ...NAVY);
rect(0, H - 6, W, 6, ...NAVY);
rect(0, 0, 6, H, ...NAVY);
rect(W - 6, 0, 6, H, ...NAVY);

// ---------------------------------------------------------------- PNG encode
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function encodePNG() {
  const raw = Buffer.alloc(H * (1 + W * 4));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 4)] = 0;
    img.copy(raw, y * (1 + W * 4) + 1, y * W * 4, (y + 1) * W * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type RGBA
  ihdr[10] = 0;  // compression
  ihdr[11] = 0;  // filter
  ihdr[12] = 0;  // interlace
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const png = encodePNG();
writeFileSync('entry.png', png);
console.log('wrote entry.png ' + png.length + ' bytes');
