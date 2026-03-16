const DAYS_IN_MONTH = 30; // Assuming 30
const DAYS_IN_YEAR = 365;

// assets
const assets = [
  { name: '자가용 (아반떼)', amount: 15000000, type: 'asset', assetCategory: 'vehicle', depreciationRate: 10 }
];

const depreciationBurn = assets.reduce((total, asset) => {
  if (asset.type === "asset" && asset.assetCategory === "vehicle" && asset.depreciationRate) {
    const annualDepreciation = (Number(asset.amount) || 0) * (Number(asset.depreciationRate) / 100);
    return total + (annualDepreciation / DAYS_IN_YEAR);
  }
  return total;
}, 0);

console.log("depreciationBurn: ", depreciationBurn);

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

console.log("txBurn: ", txBurn);

const rawDailyBurnRate = txBurn + depreciationBurn;
const dailyBurnRate = Number(rawDailyBurnRate.toFixed(1));
const perSecondBurnRate = rawDailyBurnRate / (24 * 60 * 60);

console.log("rawDailyBurnRate:", rawDailyBurnRate);
console.log("perSecondBurnRate:", perSecondBurnRate);

