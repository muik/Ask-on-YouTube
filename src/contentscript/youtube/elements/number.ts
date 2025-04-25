/**
 * Extracts a number from a text string by removing all non-numeric characters.
 * Returns 0 if the result is NaN.
 * @param text - The text string containing the number
 * @returns The parsed number or 0 if parsing fails
 */
export function getNumberFromText(text: string): number {
    // Remove all non-numeric characters and parse as integer
    return parseInt(text.replace(/\D/g, "")) || 0;
}
