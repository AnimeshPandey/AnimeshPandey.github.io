/**
 * png-alpha.mjs — minimal, dependency-free PNG decoder scoped to exactly
 * what this repo's pose assets use: 8-bit-depth, non-interlaced, truecolor
 * (colorType 2) or truecolor+alpha (colorType 6) PNGs. Not a general PNG
 * decoder — palette images, 16-bit depth, and interlacing raise rather
 * than guess. Uses only Node's built-in zlib; no new dependency.
 */
import zlib from 'node:zlib';

const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function readChunks(buf) {
  if (!buf.subarray(0, 8).equals(SIGNATURE)) {
    throw new Error('Not a PNG file (bad signature)');
  }
  const chunks = [];
  let offset = 8;
  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    const data = buf.subarray(offset + 8, offset + 8 + length);
    chunks.push({ type, data });
    offset += 8 + length + 4; // length + type + data + CRC
  }
  return chunks;
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function unfilter(raw, width, height, bpp) {
  const stride = width * bpp;
  const out = Buffer.alloc(stride * height);
  let rawOffset = 0;
  for (let y = 0; y < height; y++) {
    const filterType = raw[rawOffset];
    rawOffset += 1;
    const rowStart = y * stride;
    const prevRowStart = (y - 1) * stride;
    for (let x = 0; x < stride; x++) {
      const raw_x = raw[rawOffset + x];
      const a = x >= bpp ? out[rowStart + x - bpp] : 0;
      const b = y > 0 ? out[prevRowStart + x] : 0;
      const c = y > 0 && x >= bpp ? out[prevRowStart + x - bpp] : 0;
      let value;
      switch (filterType) {
        case 0: value = raw_x; break;
        case 1: value = raw_x + a; break;
        case 2: value = raw_x + b; break;
        case 3: value = raw_x + Math.floor((a + b) / 2); break;
        case 4: value = raw_x + paeth(a, b, c); break;
        default: throw new Error(`Unsupported PNG filter type ${filterType}`);
      }
      out[rowStart + x] = value & 0xff;
    }
    rawOffset += stride;
  }
  return out;
}

/**
 * Decodes a PNG buffer into { width, height, rgba }, where rgba is a
 * Buffer of width*height*4 bytes (always normalized to RGBA, alpha=255
 * for colorType 2 images with no alpha channel).
 */
export function decodePNG(buf) {
  const chunks = readChunks(buf);
  const ihdr = chunks.find((c) => c.type === 'IHDR');
  if (!ihdr) throw new Error('Missing IHDR chunk');

  const width = ihdr.data.readUInt32BE(0);
  const height = ihdr.data.readUInt32BE(4);
  const bitDepth = ihdr.data.readUInt8(8);
  const colorType = ihdr.data.readUInt8(9);
  const interlace = ihdr.data.readUInt8(12);

  if (bitDepth !== 8) throw new Error(`Unsupported bit depth ${bitDepth} (only 8-bit supported)`);
  if (interlace !== 0) throw new Error('Interlaced PNGs are not supported');
  if (colorType !== 2 && colorType !== 6) {
    throw new Error(`Unsupported color type ${colorType} (only truecolor/truecolor+alpha supported)`);
  }
  const srcBpp = colorType === 6 ? 4 : 3;

  const idatData = Buffer.concat(chunks.filter((c) => c.type === 'IDAT').map((c) => c.data));
  const raw = zlib.inflateSync(idatData);
  const unfiltered = unfilter(raw, width, height, srcBpp);

  if (srcBpp === 4) {
    return { width, height, rgba: unfiltered };
  }
  // RGB -> RGBA, alpha opaque
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0, j = 0; i < unfiltered.length; i += 3, j += 4) {
    rgba[j] = unfiltered[i];
    rgba[j + 1] = unfiltered[i + 1];
    rgba[j + 2] = unfiltered[i + 2];
    rgba[j + 3] = 255;
  }
  return { width, height, rgba };
}
