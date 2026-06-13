/**
 * Formats a numeric price or string representing price into currency notation.
 * Uses en-IN formatting for Indian Rupees (₹) by default, removing decimals.
 * Can be customized to support other currencies later.
 * 
 * @param price - The numeric value or string of the price
 * @param currencyCode - Standard ISO currency code (e.g. 'INR', 'USD')
 * @param locale - BCP 47 language tag (e.g. 'en-IN', 'en-US')
 * @returns Formatted currency string
 */
export const formatCurrency = (
  price: number | string | null | undefined,
  currencyCode = 'INR',
  locale = 'en-IN'
): string => {
  if (price === null || price === undefined) return '';
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return '';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0
  }).format(numPrice);
};
