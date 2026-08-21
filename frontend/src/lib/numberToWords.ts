/**
 * Converts a numeric amount into Indian Currency Words
 * e.g. 2 -> "Rupees Two Only"
 *      45000 -> "Rupees Forty-Five Thousand Only"
 */

const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function numToWordsHelper(n: number): string {
  if (n === 0) return "";
  if (n < 20) return ones[n] + " ";
  if (n < 100) return tens[Math.floor(n / 10)] + " " + numToWordsHelper(n % 10);
  if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred " + numToWordsHelper(n % 100);
  if (n < 100000) return numToWordsHelper(Math.floor(n / 1000)) + "Thousand " + numToWordsHelper(n % 1000);
  if (n < 10000000) return numToWordsHelper(Math.floor(n / 100000)) + "Lakh " + numToWordsHelper(n % 100000);
  return numToWordsHelper(Math.floor(n / 10000000)) + "Crore " + numToWordsHelper(n % 10000000);
}

export function amountToIndianWords(amount: number): string {
  if (amount <= 0 || isNaN(amount)) return "Zero Rupees Only";
  const wholePart = Math.floor(amount);
  const words = numToWordsHelper(wholePart).trim();
  return `Rupees ${words} Only`;
}
