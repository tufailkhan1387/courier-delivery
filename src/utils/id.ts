export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

/** e.g. CPLHE48201937 — CP + origin city code + 8 digits. */
export function generateTrackingNumber(cityCode: string) {
  const digits = Math.floor(10_000_000 + Math.random() * 89_999_999)
  return `CP${cityCode}${digits}`
}
