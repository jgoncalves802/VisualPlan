
/**
 * Deterministic formatting utilities to prevent hydration errors
 * All functions return consistent results on server and client
 */

/**
 * Format number with thousands separator
 * Always returns consistent format (e.g., "1,234,567")
 */
export function formatNumber(value: number): string {
  const formatted = Math.round(value).toString();
  const parts = [];
  for (let i = formatted.length; i > 0; i -= 3) {
    parts.unshift(formatted.slice(Math.max(0, i - 3), i));
  }
  return parts.join(',');
}

/**
 * Format currency with dollar sign
 * Always returns consistent format (e.g., "$1,234")
 */
export function formatCurrency(value: number): string {
  return `$${formatNumber(value)}`;
}

/**
 * Format date as MM/DD/YYYY
 * Always returns consistent format regardless of timezone
 */
export function formatDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

/**
 * Format date as MMM DD, YYYY (e.g., "Jan 01, 2024")
 * Always returns consistent format
 */
export function formatDateLong(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}
