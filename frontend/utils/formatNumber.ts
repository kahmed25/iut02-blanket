/**
 * Format a number with thousand separators while preserving decimals
 * This is used to display numbers exactly as stored in DynamoDB
 *
 * @param value - The number to format
 * @param minDecimals - Minimum decimal places to show (default: 0)
 * @param maxDecimals - Maximum decimal places to show (default: 2)
 * @returns Formatted string with thousand separators and decimals preserved
 */
export function formatNumber(
  value: number | undefined | null,
  minDecimals: number = 0,
  maxDecimals: number = 2
): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0';
  }

  // Use Intl.NumberFormat for proper formatting with decimal control
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  }).format(value);
}

/**
 * Format currency with Taka symbol and proper decimals
 *
 * @param value - The amount to format
 * @param showDecimals - Whether to show decimal places (default: true)
 * @returns Formatted currency string with ৳ symbol
 */
export function formatCurrency(
  value: number | undefined | null,
  showDecimals: boolean = true
): string {
  const formatted = formatNumber(value, showDecimals ? 2 : 0, showDecimals ? 2 : 0);
  return `৳${formatted}`;
}

/**
 * Format a number as whole number (no decimals) with thousand separators
 * This is the default for currency display - shows clean whole numbers
 *
 * @param value - The number to format
 * @returns Formatted string with thousand separators, no decimals
 */
export function formatExact(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0';
  }

  // Round to whole number and format with thousand separators
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}
