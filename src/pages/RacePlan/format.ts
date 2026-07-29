export function fmtTime(mins: number) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}` : `${m} min`
}

export function parseTimeToMins(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

export function fmtPassage(totalMins: number): string {
  const h = Math.floor(totalMins / 60) % 24
  const m = totalMins % 60
  return `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`
}

// Saisie d'heure "HH:mm" en 24h, sans passer par le picker natif <input type="time">
// (rendu non maîtrisable et affichant AM/PM selon l'OS).
export function sanitizeTimeInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}:${digits.slice(2)}`
}

export function normalizeTimeInput(value: string): string {
  const [h, m] = value.split(':')
  if (!h) return ''
  const hh = Math.min(23, parseInt(h, 10) || 0)
  const mm = Math.min(59, parseInt(m || '0', 10) || 0)
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export function fmtQty(n: number): string {
  return Number.isInteger(n) ? String(n) : String(n).replace('.', ',')
}

// Autorise les chiffres à virgule (',' ou '.') tout en gardant un seul séparateur.
export function sanitizeQtyInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.,]/g, '')
  const sepIdx = cleaned.search(/[.,]/)
  if (sepIdx === -1) return cleaned
  return cleaned.slice(0, sepIdx + 1) + cleaned.slice(sepIdx + 1).replace(/[.,]/g, '')
}

export function fmtDateFr(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function paceToSec(pace: string): number {
  const [min, sec] = pace.split(':').map(Number)
  return (isNaN(min) ? 0 : min * 60) + (isNaN(sec) ? 0 : sec)
}

export function secToPace(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
