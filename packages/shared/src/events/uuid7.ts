// RFC 9562 UUIDv7 — 48-bit Unix ms timestamp + 74 bits cryptographic random.
// Sortable, globally unique, no external dependency.

export function uuidv7(): string {
  const ms = Date.now();
  const bytes = new Uint8Array(16);

  // Timestamp (48 bits, big-endian)
  bytes[0] = (ms >>> 40) & 0xff;
  bytes[1] = (ms >>> 32) & 0xff;
  bytes[2] = (ms >>> 24) & 0xff;
  bytes[3] = (ms >>> 16) & 0xff;
  bytes[4] = (ms >>> 8) & 0xff;
  bytes[5] = ms & 0xff;

  // Random (10 bytes / 80 bits)
  crypto.getRandomValues(bytes.subarray(6, 16));

  // Version 7: top 4 bits of byte 6 = 0b0111
  bytes[6] = (bytes[6] & 0x0f) | 0x70;

  // Variant 10xx: top 2 bits of byte 8 = 0b10
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
