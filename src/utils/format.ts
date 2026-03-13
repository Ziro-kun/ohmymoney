export const formatNumber = (val: string | number): string => {
  if (val === null || val === undefined || val === "") return "";

  const str = val.toString();
  const isNegative = str.startsWith("-");

  // Split into integer and decimal parts
  const parts = str.replace(/[^0-9.-]/g, "").split(".");
  let integerPart = parts[0].replace(/-/g, "");
  const decimalPart = parts.length > 1 ? parts[1] : null;

  if (!integerPart && !decimalPart) return isNegative ? "-" : "";

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
    decimalPart !== null
      ? `${formattedInteger}.${decimalPart}`
      : formattedInteger;
  return isNegative ? `-${result}` : result;
};

/**
 * 금액 문자열에서 쉼표를 제거하고 순수 숫자 문자열로 반환합니다.
 */
export const unformatNumber = (val: string): string => {
  return val.replace(/,/g, "");
};
