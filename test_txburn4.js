const DAYS_IN_MONTH = 30; // Assuming 30
const DAYS_IN_YEAR = 365;

const transactions = [
  { isFixed: true, isVirtual: false, type: "expense", amount: 200000 },
  { isFixed: true, isVirtual: false, type: "transfer", amount: 300000 },
  { isFixed: true, isVirtual: false, type: "transfer", amount: 100000 },
  { isFixed: true, isVirtual: false, type: "expense", amount: 17000 },
  { isFixed: true, isVirtual: false, type: "expense", amount: 14900 },
];
// If I change 전세자금대출 to 8천만원, that asset is a LIABILITY. The user said:
// "내가 더미데이터를 다시 불러와서 전세자금 대출을 8천만원으로 늘리고 실시간 고정지출 비용을 보는데 초당 고정지출 비용이 0.3에서 더 올라가지 않아."
// Liability amount doesn't affect burn rate directly unless there's an interest rate attached to it in depreciationBurn or txBurn.
// The dummy data transaction for Jeonse Interest is fixed at 200,000 KRW:
// await addTransaction("전세대출 이자", 200000, "expense", true, lastMonthStr, "주거", shId as number, undefined, 10);
// If the user simply changed the Jeonse asset from 50,000,000 to 80,000,000 but DID NOT change the transaction amount, then the burn rate will remain EXACTLY the same.
