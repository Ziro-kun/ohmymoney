const DAYS_IN_MONTH = 30; // Assuming 30
const DAYS_IN_YEAR = 365;

const transactions = [
  { isFixed: true, isVirtual: false, type: "expense", amount: 200000 }, // 전세대출 이자
  { isFixed: true, isVirtual: false, type: "transfer", amount: 300000 }, // 신용대출 상환
  { isFixed: true, isVirtual: false, type: "transfer", amount: 100000 }, // 청약저축
  { isFixed: true, isVirtual: false, type: "expense", amount: 17000 },
  { isFixed: true, isVirtual: false, type: "expense", amount: 14900 },
];
const txBurn = transactions.reduce((total, tx) => {
  const amt = Number(tx.amount) || 0;
  // Count BOTH FIXED EXPENSES AND FIXED TRANSFERS (like loan repayments). 
  if (tx.isFixed && !tx.isVirtual && (tx.type === "expense" || tx.type === "transfer")) {
    return total + amt / DAYS_IN_MONTH;
  }
  return total;
}, 0);

console.log("txBurn: ", txBurn);

const rawDailyBurnRate = txBurn;
const dailyBurnRate = Number(rawDailyBurnRate.toFixed(1));
const perSecondBurnRate = rawDailyBurnRate / (24 * 60 * 60);

console.log("rawDailyBurnRate:", rawDailyBurnRate);
console.log("perSecondBurnRate:", perSecondBurnRate);

