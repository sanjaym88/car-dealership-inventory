/** "2026-10-24T12:00:00Z" -> "Oct 24, 2026" in the viewer's time zone. */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
