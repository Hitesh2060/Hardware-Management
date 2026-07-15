/** Rounds to 2 decimal places using standard "round half up" (avoids float drift in money math). */
export function roundCurrency(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function formatCurrency(value, currencySymbol = 'Rs.') {
  return `${currencySymbol} ${roundCurrency(value).toFixed(2)}`;
}

/** Computes tax amount from a base amount and a percentage (e.g. VAT 13%). */
export function calculateTax(baseAmount, taxPercent) {
  return roundCurrency((Number(baseAmount) * Number(taxPercent)) / 100);
}
