/**
 * Gera icon-192.png e icon-512.png para o PWA usando Node.js puro (sem dependências externas).
 * Produz um quadrado verde (#15803d) com borda verde-escura — compatível com maskable.
 * Execute com: node scripts/generate-icons.mjs
 */

import { createRequire } from 'module'
import { mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const require = createRequire(import.meta.url)
const zlib = require('zlib')
const __dirname = dirname(fileURLToPath(import.meta.url))

// CRC32 necessário para o formato PNG
const crcTable = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
  crcTable[n] = c
}
function crc32(buf) {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function generateIcon(size) {
  const IHDR = Buffer.alloc(13)
  IHDR.writeUInt32BE(size, 0); IHDR.writeUInt32BE(size, 4)
  IHDR[8] = 8; IHDR[9] = 2 // bit depth 8, color type RGB

  const scanline = 1 + size * 3
  const raw = Buffer.alloc(size * scanline)

  for (let y = 0; y < size; y++) {
    raw[y * scanline] = 0 // filter: None
    for (let x = 0; x < size; x++) {
      const o = y * scanline + 1 + x * 3
      // Fundo verde (#15803d = 21, 128, 61)
      // Safe zone maskable: círculo interno ~80% com verde claro (#16a34a = 22, 163, 74)
      const cx = size / 2, cy = size / 2, r = size * 0.38
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
      if (dist < r) {
        raw[o] = 22; raw[o + 1] = 163; raw[o + 2] = 74  // verde claro (círculo)
      } else {
        raw[o] = 21; raw[o + 1] = 128; raw[o + 2] = 61  // verde escuro (borda)
      }
    }
  }

  const idat = zlib.deflateSync(raw)
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // assinatura PNG
    chunk('IHDR', IHDR),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const outDir = join(__dirname, '..', 'public', 'icons')
mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'icon-192.png'), generateIcon(192))
writeFileSync(join(outDir, 'icon-512.png'), generateIcon(512))
console.log('✓ public/icons/icon-192.png e icon-512.png gerados')
