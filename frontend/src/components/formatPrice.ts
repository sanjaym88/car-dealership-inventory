/** 25000 -> "$25,000", 45999.5 -> "$45,999.50" (cents shown only when there are any). */
export function formatPrice(price: number): string {
  const digits = Number.isInteger(price) ? 0 : 2
  return price.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}
