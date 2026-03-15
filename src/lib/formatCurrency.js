export function formatPeso(amount) {
  const num = Number(amount)
  if (isNaN(num)) return '₱0.00'
  return '₱' + num.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatPesoShort(amount) {
  const num = Number(amount)
  if (isNaN(num)) return '₱0'
  if (num >= 1000000) return '₱' + (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return '₱' + (num / 1000).toFixed(1) + 'K'
  return '₱' + num.toLocaleString('en-PH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}
