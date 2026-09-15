export function amountToWords(amount: number): string {
  if (amount === 0) return 'INR Zero Only';
  if (amount < 0) return 'INR ' + amountToWords(Math.abs(amount)).replace('INR ', 'Minus ');

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
                'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertNumber(num: number): string {
    if (num === 0) return '';
    if (num < 20) return ones[num] + ' ';
    if (num < 100) return tens[Math.floor(num / 10)] + ' ' + convertNumber(num % 10);
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred ' + convertNumber(num % 100);
    if (num < 100000) return convertNumber(Math.floor(num / 1000)) + 'Thousand ' + convertNumber(num % 1000);
    if (num < 10000000) return convertNumber(Math.floor(num / 100000)) + 'Lakh ' + convertNumber(num % 100000);
    return convertNumber(Math.floor(num / 10000000)) + 'Crore ' + convertNumber(num % 10000000);
  }

  const integerPart = Math.floor(amount);
  const decimalPart = Math.round((amount - integerPart) * 100);

  let result = 'INR ';
  
  if (integerPart > 0) {
    result += convertNumber(integerPart).trim();
  } else {
    result += 'Zero';
  }

  if (decimalPart > 0) {
    result += ' and ' + convertNumber(decimalPart).trim() + ' Paise';
  }

  return result + ' Only';
}
