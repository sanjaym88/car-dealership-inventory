const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

/** 25000 -> "$25,000", 45999.5 -> "$45,999.50" (cents shown only when there are any). */
export function formatPrice(price: number): string {
  return Number.isInteger(price) ? usd.format(price) : usd.format(price).replace(/\.(\d)$/, '.$10')
}
