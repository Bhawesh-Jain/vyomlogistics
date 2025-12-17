/**
 * NumberHelper
 *
 * A helper class for number-related operations such as parsing,
 * rounding, formatting, percentage handling, and safe math utilities.
 */
export class NumberHelper {
  /**
   * Ensure the input is a valid number.
   * @param value - The value to validate.
   * @returns A valid number.
   */
  static toNumber(value: any): number {
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }

    const parsed = Number(value);
    if (isNaN(parsed)) {
      throw new Error('Input must be a valid number');
    }

    return parsed;
  }

  /**
   * Round a number to a fixed number of decimal places.
   * @param value - The number to round.
   * @param decimals - Number of decimal places.
   * @returns Rounded number.
   */
  static round(value: number, decimals: number = 2): number {
    value = this.toNumber(value);
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  /**
   * Floor a number to a fixed number of decimal places.
   */
  static floor(value: number, decimals: number = 2): number {
    value = this.toNumber(value);
    const factor = Math.pow(10, decimals);
    return Math.floor(value * factor) / factor;
  }

  /**
   * Ceil a number to a fixed number of decimal places.
   */
  static ceil(value: number, decimals: number = 2): number {
    value = this.toNumber(value);
    const factor = Math.pow(10, decimals);
    return Math.ceil(value * factor) / factor;
  }

  /**
   * Format a number with locale support.
   * @param value - The number to format.
   * @param options - Intl.NumberFormat options.
   * @param locale - Locale (default: 'en-IN')
   */
  static format(
    value: number,
    options?: Intl.NumberFormatOptions,
    locale: string = 'en-IN'
  ): string {
    value = this.toNumber(value);
    return new Intl.NumberFormat(locale, options).format(value);
  }

  /**
   * Format a number with fixed decimals (no currency).
   */
  static formatFixed(
    value: number,
    decimals: number = 2,
    locale: string = 'en-IN'
  ): string {
    value = this.toNumber(value);
    return this.format(
      value,
      {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      },
      locale
    );
  }

  /**
   * Convert a value to percentage.
   * Example: 0.25 → 25
   */
  static toPercentage(value: number, decimals: number = 2): number {
    value = this.toNumber(value);
    return this.round(value * 100, decimals);
  }

  /**
   * Convert percentage back to decimal.
   * Example: 25 → 0.25
   */
  static fromPercentage(value: number, decimals: number = 4): number {
    value = this.toNumber(value);
    return this.round(value / 100, decimals);
  }

  /**
   * Format a number as percentage string.
   */
  static formatPercentage(
    value: number,
    decimals: number = 2,
    locale: string = 'en-IN'
  ): string {
    value = this.toNumber(value);
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }

  /**
   * Safely divide two numbers.
   * Returns 0 if divisor is 0.
   */
  static safeDivide(
    numerator: number,
    denominator: number,
    decimals: number = 2
  ): number {
    numerator = this.toNumber(numerator);
    denominator = this.toNumber(denominator);

    if (denominator === 0) return 0;

    return this.round(numerator / denominator, decimals);
  }

  /**
   * Clamp a number between min and max.
   */
  static clamp(value: number, min: number, max: number): number {
    value = this.toNumber(value);
    return Math.min(Math.max(value, min), max);
  }
}
