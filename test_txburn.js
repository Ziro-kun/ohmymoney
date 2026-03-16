const DAYS_IN_MONTH = 30; // Assuming 30
const transactions = [
  { isFixed: true, isVirtual: false, type: "expense", amount: 200000 },
  { isFixed: true, isVirtual: false, type: "transfer", amount: 300000 },
  { isFixed: true, isVirtual: false, type: "transfer", amount: 100000 },
  { isFixed: true, isVirtual: false, type: "expense", amount: 17000 },
  { isFixed: true, isVirtual: false, type: "expense", amount: 14900 },
];
const txBurn = transactions.reduce((total, tx) => {
  const amt = Number(tx.amount) || 0;
  if (tx.isFixed && !tx.isVirtual && (tx.type === "expense" || tx.type === "transfer")) {
    return total + amt / DAYS_IN_MONTH;
  }
  return total;
}, 0);
console.log(txBurn);
const perSecond = txBurn / (24 * 60 * 60);
console.log(perSecond);
