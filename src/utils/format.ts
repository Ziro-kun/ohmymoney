export const formatNumber = (
  val: string | number,
  precision: number = 1,
): string => {
  if (val === null || val === undefined || val === "") return "";

  // Remove commas if string and convert to number
  const cleanVal = typeof val === "string" ? val.replace(/,/g, "") : val;
  const num = Number(cleanVal);

  if (isNaN(num)) return "";

  // Format to requested decimal places
  const str = num.toFixed(precision);
  const isNegative = str.startsWith("-");

  // Split into integer and decimal parts
  const parts = str.split(".");
  let integerPart = parts[0].replace(/-/g, "");
  const decimalPart = parts[1];

  // Format integer part with commas
  let formattedInteger = "";
  let count = 0;
  for (let i = integerPart.length - 1; i >= 0; i--) {
    formattedInteger = integerPart[i] + formattedInteger;
    count++;
    if (count % 3 === 0 && i !== 0) {
      formattedInteger = "," + formattedInteger;
    }
  }

  const result =
    precision > 0 ? `${formattedInteger}.${decimalPart}` : formattedInteger;
  return isNegative ? `-${result}` : result;
};

/**
 * 금액 문자열에서 쉼표를 제거하고 순수 숫자 문자열로 반환합니다.
 */
export const unformatNumber = (val: string): string => {
  return val.replace(/,/g, "");
};
