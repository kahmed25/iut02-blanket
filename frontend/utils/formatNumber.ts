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
 * Format a number preserving all its decimal places as stored
 * This shows the exact value from the database without rounding
 *
 * @param value - The number to format
 * @returns Formatted string preserving original decimals
 */
export function formatExact(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0';
  }

  // Convert to string to check for decimals
  const str = value.toString();
  const decimalIndex = str.indexOf('.');

  if (decimalIndex === -1) {
    // No decimals, just add thousand separators
    return new Intl.NumberFormat('en-US').format(value);
  }

  // Count decimal places in the original number
  const decimalPlaces = str.length - decimalIndex - 1;

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(value);
}
