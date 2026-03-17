import { create } from "zustand";
import {
  addAsset,
  addTransaction as dbAddTransaction,
  getAssets,
  getExpenses,
  getTransactions,
  initializeDB,
  loadDummyData,
  removeAsset,
  removeTransaction,
  updateAsset,
  updateTransaction as dbUpdateTransaction,
  getSetting,
  updateSetting,
  clearAllData as dbClearAllData,
} from "../db/sqlite";

export interface Asset {
  id: number;
  name: string;
  amount: number;
  seedAmount?: number; // Original DB seed before transaction history is applied
  type: "asset" | "liability";
  assetCategory?: string;
  depreciationRate?: number;
  createdAt?: string;
}

export interface Expense {
  id: number;
  name: string;
  amount: number;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
}

export interface Transaction {
  id: number;
  description: string;
  amount: number;
  date: string;
  type: "income" | "expense" | "transfer";
  category?: string;
  isFixed?: boolean;
  assetId?: number;
  toAssetId?: number;
  recurringDay?: number | null;
  isVirtual?: boolean;
}

interface FinanceState {
  isInitialized: boolean;
  assets: Asset[];
  expenses: Expense[];
  transactions: Transaction[];

  // Computed (updated regularly)
  netWorth: number;
  dailyBurnRate: number; // How much it costs to live per day
  perSecondBurnRate: number; // Cost per second

  // Methods
  loadData: () => Promise<void>;
  addAsset: (
    name: string,
    amount: number,
    type: "asset" | "liability",
    assetCategory?: string,
    depreciationRate?: number
  ) => Promise<void>;
  updateAsset: (
    id: number,
    name: string,
    amount: number,
    type: "asset" | "liability",
    assetCategory?: string,
    depreciationRate?: number
  ) => Promise<void>;
  deleteAsset: (id: number) => Promise<void>;
  addTransaction: (
    name: string,
    amount: number,
    type: string,
    isFixed?: boolean,
    date?: string,
    category?: string,
    assetId?: number,
    toAssetId?: number,
    recurringDay?: number | null
  ) => Promise<void>;
  updateTransaction: (
    id: number,
    name: string,
    amount: number,
    type: string,
    isFixed?: boolean,
    date?: string,
    category?: string,
    assetId?: number,
    toAssetId?: number,
    recurringDay?: number | null
  ) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
  applyDummyData: () => Promise<void>;
  addComplexAsset: (
    assetName: string,
    totalValue: number,
    assetCategory: string,
    depreciationRate: number,
    registerAsAsset: boolean,
    cashAssetId: number | undefined,
    downPayment: number,
    loanName: string,
    loanAmount: number,
    monthlyPayment: number
  ) => Promise<void>;
  addLoan: (
    loanName: string,
    loanAmount: number,
    targetAssetId: number | undefined,
    monthlyPayment: number,
    payoutType: "account" | "direct"
  ) => Promise<void>;
  repayLoan: (
    loanId: number,
    amount: number,
    sourceAssetId: number,
    penalty: number
  ) => Promise<void>;
  refinanceLoan: (
    oldLoanId: number,
    newLoanName: string,
    newLoanAmount: number,
    targetAssetId: number,
    monthlyPayment: number
  ) => Promise<void>;
  
  autoGenerateVirtualTxs: boolean;
  setAutoGenerateVirtualTxs: (val: boolean) => Promise<void>;
  isPrivacyMode: boolean;
  setPrivacyMode: (val: boolean) => Promise<void>;
  isSecurityEnabled: boolean;
  setSecurityEnabled: (val: boolean) => Promise<void>;
  isBiometricEnabled: boolean;
  setBiometricEnabled: (val: boolean) => Promise<void>;
  pinLength: 4 | 6;
  setPinLength: (val: 4 | 6) => Promise<void>;
  isAppLocked: boolean;
  setAppLocked: (val: boolean) => void;
  clearAllData: () => Promise<void>;
  isColorBlindMode: boolean;
  setColorBlindMode: (val: boolean) => Promise<void>;
  isAutoDepreciationEnabled: boolean;
  setAutoDepreciationEnabled: (val: boolean) => Promise<void>;
}

import { DAYS_IN_MONTH, DAYS_IN_YEAR } from "../../constants/finance";

// Helpers for calculations
const calculateDailyBurn = (
  expenses: Expense[] = [],
  transactions: Transaction[] = [],
  assets: Asset[] = []
) => {
  // We use scaled integers (amount * 1000) for all burn calculations to prevent 
  // floating point precision loss during micro-tick deductions in the UI.
  const SCALE = 1000;

  // 1. Manual recurring expenses (from expenses table)
  const expenseBurnScaled = expenses.reduce((total, exp) => {
    const amt = Number(exp.amount) || 0;
    const scaledAmt = Math.round(amt * SCALE);
    switch (exp.frequency) {
      case "daily": return total + scaledAmt;
      case "weekly": return total + Math.round(scaledAmt / 7);
      case "monthly": return total + Math.round(scaledAmt / DAYS_IN_MONTH);
      case "yearly": return total + Math.round(scaledAmt / DAYS_IN_YEAR);
      default: return total;
    }
  }, 0);

  // 2. Fixed transactions (Repayments & Recurring Expenses)
  const txBurnScaled = transactions.reduce((total, tx) => {
    const amt = Number(tx.amount) || 0;
    const scaledAmt = Math.round(amt * SCALE);
    if (tx.isFixed && !tx.isVirtual && (tx.type === "expense" || tx.type === "transfer")) {
      return total + Math.round(scaledAmt / DAYS_IN_MONTH);
    }
    return total;
  }, 0);

  // 3. Asset Depreciation & Liability Interest (A real drop in Net Worth over time)
  // CRITICAL: The `assets` array passed here is `depreciatedAssets`, which contains the
  // dynamically calculated real-time running balance (Seed +/- all transactions), NOT the static DB seed.
  const depreciationBurnScaled = assets.reduce((total, asset) => {
    const amt = Number(asset.amount) || 0;
    const rate = Number(asset.depreciationRate) || 0;
    const scaledAmt = Math.round(amt * SCALE);

    if (asset.type === "asset" && asset.assetCategory === "vehicle" && rate) {
      const annualDepreciation = scaledAmt * (rate / 100);
      return total + Math.round(annualDepreciation / DAYS_IN_YEAR);
    }
    // For loans (liabilities), depreciationRate = annual interest rate.
    // Uses real-time principal. Any repayment immediately lowers `amt`, instantly lowering the burn rate.
    if (asset.type === "liability" && asset.assetCategory === "loan" && rate) {
      const annualInterest = scaledAmt * (rate / 100);
      return total + Math.round(annualInterest / DAYS_IN_YEAR);
    }
    return total;
  }, 0);

  // 4. Recent Variable Expenses (Dynamic Weight)
  // Sum of non-fixed expenses from the last 7 days averaged per day.
  const todayStr = new Date().toISOString().split("T")[0];
  const sevenDaysAgoDate = new Date();
  sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgoDate.toISOString().split("T")[0];

  const recentVariableBurnScaled = transactions.reduce((total, tx) => {
    if (!tx.isFixed && !tx.isVirtual && tx.type === "expense" && tx.date >= sevenDaysAgoStr && tx.date <= todayStr) {
      const amt = Number(tx.amount) || 0;
      const scaledAmt = Math.round(amt * SCALE);
      return total + scaledAmt;
    }
    return total;
  }, 0) / 7;

  return (expenseBurnScaled + txBurnScaled + depreciationBurnScaled + Math.round(recentVariableBurnScaled)) / SCALE;
};

export const useFinanceStore = create<FinanceState>((set, get) => ({
  isInitialized: false,
  assets: [],
  expenses: [],
  transactions: [],
  netWorth: 0,
  dailyBurnRate: 0,
  perSecondBurnRate: 0,
  autoGenerateVirtualTxs: true,
  isPrivacyMode: false,
  isColorBlindMode: false,
  isAutoDepreciationEnabled: true,

  setPrivacyMode: async (val: boolean) => {
    await updateSetting("isPrivacyMode", val ? "true" : "false");
    set({ isPrivacyMode: val });
  },
  setAutoGenerateVirtualTxs: async (val: boolean) => {
    await updateSetting("autoGenerateVirtualTxs", val ? "true" : "false");
    set({ autoGenerateVirtualTxs: val });
    await get().loadData();
  },
  setColorBlindMode: async (val: boolean) => {
    await updateSetting("isColorBlindMode", val ? "true" : "false");
    set({ isColorBlindMode: val });
  },
  setAutoDepreciationEnabled: async (val: boolean) => {
    await updateSetting("isAutoDepreciationEnabled", val ? "true" : "false");
    set({ isAutoDepreciationEnabled: val });
    await get().loadData();
  },

  isSecurityEnabled: false,
  isBiometricEnabled: false,
  pinLength: 4,
  isAppLocked: true,

  setSecurityEnabled: async (val: boolean) => {
    await updateSetting("isSecurityEnabled", val ? "true" : "false");
    set({ isSecurityEnabled: val });
  },
  setBiometricEnabled: async (val: boolean) => {
    await updateSetting("isBiometricEnabled", val ? "true" : "false");
    set({ isBiometricEnabled: val });
  },
  setPinLength: async (val: 4 | 6) => {
    await updateSetting("pinLength", val.toString());
    set({ pinLength: val });
  },
  setAppLocked: (val: boolean) => set({ isAppLocked: val }),

  loadData: async () => {
    await initializeDB();
    const autoGenSetting = await getSetting("autoGenerateVirtualTxs", "true");
    const autoGenerateVirtualTxs = autoGenSetting === "true";
    const privacySetting = await getSetting("isPrivacyMode", "false");
    const isPrivacyMode = privacySetting === "true";
    const colorBlindSetting = await getSetting("isColorBlindMode", "false");
    const isColorBlindMode = colorBlindSetting === "true";
    const autoDepreciationSetting = await getSetting("isAutoDepreciationEnabled", "true");
    const isAutoDepreciationEnabled = autoDepreciationSetting === "true";

    const securityEnabledSetting = await getSetting("isSecurityEnabled", "false");
    const isSecurityEnabled = securityEnabledSetting === "true";
    const biometricEnabledSetting = await getSetting("isBiometricEnabled", "false");
    const isBiometricEnabled = biometricEnabledSetting === "true";
    const pinLengthSetting = await getSetting("pinLength", "4");
    const pinLength = (pinLengthSetting === "6" ? 6 : 4) as 4 | 6;
    
    const rawAssetsData = (await getAssets()) as Asset[];
    // Preserve DB seed amounts before transaction history is applied
    const assetsData: Asset[] = rawAssetsData.map(a => ({ ...a, seedAmount: a.amount }));
    const expensesData = (await getExpenses()) as Expense[];
    const rawTransactionsData = (await getTransactions()) as any[];

    // Expand fixed transactions with recurringDay into virtual transactions
    const transactionsData: any[] = [];
    const todayStr = new Date().toISOString().split("T")[0];
    const todayDate = new Date(todayStr);
    const currentYear = todayDate.getFullYear();
    const currentMonth = todayDate.getMonth();
    const currentDay = todayDate.getDate();

    for (const tx of rawTransactionsData) {
      transactionsData.push(tx); // Include original

      if (autoGenerateVirtualTxs && tx.isFixed && tx.recurringDay) {
        const startDateStr = tx.date ? (tx.date.includes("T") ? tx.date.split("T")[0] : tx.date) : todayStr;
        const startDate = new Date(startDateStr);
        let year = startDate.getFullYear();
        let month = startDate.getMonth() + 1; // Start checking from next month

        while (year < currentYear || (year === currentYear && month <= currentMonth)) {
          if (year === currentYear && month === currentMonth && currentDay < tx.recurringDay) {
            break; // Not yet reached the recurring day this month
          }

          const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
          const actualDay = Math.min(tx.recurringDay, lastDayOfMonth);

          const vDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(actualDay).padStart(2, '0')}`;
          
          transactionsData.push({
            ...tx,
            id: parseInt(`-1${tx.id}${year}${String(month + 1).padStart(2, '0')}`, 10), // Negative ID to mark as virtual
            date: vDateStr,
            description: `${tx.description} (정기)`,
            isVirtual: true,
          });

          month++;
          if (month > 11) {
            month = 0;
            year++;
          }
        }
      }
    }

    // Sort all transactions by date descending
    transactionsData.sort((a, b) => b.date.localeCompare(a.date));

    // Only historical or today's transactions affect current asset balances
    const effectiveTxs = transactionsData.filter(tx => tx.date <= todayStr);

    // Calculate current balances for each asset by applying transaction history to seed amounts
    const updatedAssets = assetsData.map(asset => {
      const balanceChange = effectiveTxs.reduce((change, tx) => {
        const txAmt = Number(tx.amount) || 0;
        // 1. From this asset (Money LEAVING)
        if (tx.assetId === asset.id) {
          if (tx.type === "income") return change + txAmt;
          if (tx.type === "expense") return change - txAmt;
          if (tx.type === "transfer") {
            // For Liability, "transferring out" means borrowing more money
            return asset.type === "liability" ? change + txAmt : change - txAmt;
          }
        }
        // 2. To this asset (Money ENTERING)
        if (tx.toAssetId === asset.id) {
          if (tx.type === "transfer") {
            // For Liability, "receiving transfer" means repayment (balance goes down)
            return asset.type === "liability" ? change - txAmt : change + txAmt;
          }
        }
        return change;
      }, 0);
      const finalAmt = (Number(asset.amount) || 0) + balanceChange;
      return { ...asset, amount: finalAmt };
    });

    const now = new Date();
    const depreciatedAssets = updatedAssets.map(asset => {
      let currentAmt = asset.amount;
      if (asset.type === "asset" && asset.assetCategory === "vehicle" && asset.depreciationRate) {
        const dateStr = asset.createdAt ? (asset.createdAt.includes(" ") ? asset.createdAt.replace(" ", "T") + "Z" : asset.createdAt) : null;
        const createdAt = dateStr ? new Date(dateStr) : now;
        const diffInMs = now.getTime() - createdAt.getTime();
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
        
        if (diffInDays > 0) {
          const yearsElapsed = diffInDays / 365;
          const rate = Number(asset.depreciationRate) || 0;
          const depreciation = (Number(asset.amount) || 0) * (rate / 100) * yearsElapsed;
          currentAmt = Math.max(0, currentAmt - depreciation);
        }
      }
      return { ...asset, amount: Math.round(currentAmt) };
    });

    const netWorth = depreciatedAssets.reduce((total, asset) => {
      const amt = asset.amount || 0;
      return asset.type === "asset"
        ? total + amt
        : total - amt;
    }, 0);

    // CRITICAL: Pass updated assets (which represent the running balance, not the DB seed) 
    // to the calculator to compute the exact burn rate based on current reality.
    const rawDailyBurnRate = calculateDailyBurn(expensesData, transactionsData, depreciatedAssets);
    
    // dailyBurnRate is for display purposes, so rounding it to 1 decimal place is fine.
    const dailyBurnRate = Number(rawDailyBurnRate.toFixed(1));
    
    // perSecondBurnRate MUST be as precise as possible (retaining all decimals from scaled division)
    // because it will be multiplied by elapsed milliseconds and subtracted from live balance in the UI tick.
    const perSecondBurnRate = rawDailyBurnRate / (24 * 60 * 60);

    set({
      isInitialized: true,
      assets: depreciatedAssets,
      expenses: expensesData,
      transactions: transactionsData as Transaction[],
      netWorth,
      dailyBurnRate,
      perSecondBurnRate,
      autoGenerateVirtualTxs,
      isPrivacyMode,
      isColorBlindMode,
      isAutoDepreciationEnabled,
      isSecurityEnabled,
      isBiometricEnabled,
      pinLength,
    });
  },

  addAsset: async (name, amount, type, assetCategory, depreciationRate) => {
    await addAsset(name, amount, type, assetCategory, depreciationRate);
    await get().loadData();
  },

  updateAsset: async (id, name, amount, type, assetCategory, depreciationRate) => {
    await updateAsset(id, name, amount, type, assetCategory, depreciationRate);
    await get().loadData();
  },

  deleteAsset: async (id) => {
    await removeAsset(id);
    await get().loadData();
  },

  addTransaction: async (name, amount, type, isFixed, date, category, assetId, toAssetId, recurringDay) => {
    await dbAddTransaction(name, amount, type, isFixed, date, category, assetId, toAssetId, recurringDay);
    await get().loadData();
  },

  updateTransaction: async (id, name, amount, type, isFixed, date, category, assetId, toAssetId, recurringDay) => {
    await dbUpdateTransaction(id, name, amount, type, isFixed, date, category, assetId, toAssetId, recurringDay);
    await get().loadData();
  },

  deleteTransaction: async (id) => {
    await removeTransaction(id);
    await get().loadData();
  },

  applyDummyData: async () => {
    await loadDummyData();
    await get().loadData();
  },

  clearAllData: async () => {
    await dbClearAllData();
    await get().loadData();
  },

  addComplexAsset: async (
    assetName,
    totalValue,
    assetCategory,
    depreciationRate,
    registerAsAsset,
    cashAssetId,
    downPayment,
    loanName,
    loanAmount,
    monthlyPayment
  ) => {
    const today = new Date().toISOString().split("T")[0];
    
    // 1. Create the primary asset (Seed with 0, we'll transfer value into it)
    let mainAssetId: number | null = null;
    if (registerAsAsset) {
      mainAssetId = await addAsset(assetName, 0, "asset", assetCategory, depreciationRate) as number;
    }
    
    // 2. Process down payment from cash asset if applicable
    if (cashAssetId && downPayment > 0) {
      await dbAddTransaction(
        `선수금 (${assetName})`,
        downPayment,
        "transfer",
        false,
        today,
        "자산취득",
        cashAssetId,
        mainAssetId || undefined
      );
    }
    
    // 3. Process loan if applicable
    if (loanAmount > 0) {
      const loanId = await addAsset(loanName, 0, "liability");
      
      // Inject loan balance via transfer (to Asset or to Null)
      await dbAddTransaction(
        `${loanName} 실행`,
        loanAmount,
        "transfer",
        false,
        today,
        "대출",
        loanId as number,
        mainAssetId || undefined
      );
      
      // Add recurring monthly payment
      if (cashAssetId && monthlyPayment > 0) {
        await dbAddTransaction(
          `${loanName} 상환`,
          monthlyPayment,
          "transfer",
          true,
          today,
          "대출상환",
          cashAssetId,
          loanId as number
        );
      }
    }
    
    await get().loadData();
  },

  addLoan: async (loanName, loanAmount, targetAssetId, monthlyPayment, payoutType) => {
    const today = new Date().toISOString().split("T")[0];

    // 1. Create the liability with 0 seed
    const loanId = await addAsset(loanName, 0, "liability");

    // 2. Record borrowing
    // If payoutType is 'account', transfer to targetAssetId (Debt up, Cash up)
    // If payoutType is 'direct', transfer to undefined (Debt up, Cash no change)
    await dbAddTransaction(
      `${loanName} 실행${payoutType === 'direct' ? '(기관지급)' : ''}`,
      loanAmount,
      "transfer",
      false,
      today,
      "대출",
      loanId as number,
      payoutType === 'account' ? targetAssetId : undefined
    );

    // 3. Set up monthly repayment IF an account is selected (even for direct payout)
    if (monthlyPayment > 0 && targetAssetId) {
      await dbAddTransaction(
        `${loanName} 상환`,
        monthlyPayment,
        "transfer",
        true,
        today,
        "대출상환",
        targetAssetId,
        loanId as number
      );
    }

    await get().loadData();
  },

  repayLoan: async (loanId, amount, sourceAssetId, penalty) => {
    const today = new Date().toISOString().split("T")[0];

    // 1. Record the actual repayment as a transfer (Source Account -> Loan Account)
    await dbAddTransaction(
      "대출 중도 상환",
      amount,
      "transfer",
      false,
      today,
      "대출상환",
      sourceAssetId,
      loanId
    );

    // 2. Record the penalty as a pure expense (from source account)
    if (penalty > 0) {
      await dbAddTransaction(
        "중도상환 수수료",
        penalty,
        "expense",
        false,
        today,
        "수수료",
        sourceAssetId
      );
    }

    await get().loadData();
  },

  refinanceLoan: async (oldLoanId, newLoanName, newLoanAmount, targetAssetId, monthlyPayment) => {
    const today = new Date().toISOString().split("T")[0];
    const oldLoan = get().assets.find(a => a.id === oldLoanId);
    if (!oldLoan) return;

    // 1. Create new loan
    const newLoanId = await addAsset(newLoanName, 0, "liability");

    // 2. Close old loan (New Loan -> Old Loan)
    // This settles the old debt using the new debt
    await dbAddTransaction(
      `대환대출 상환 (${newLoanName})`,
      oldLoan.amount,
      "transfer",
      false,
      today,
      "대출상환",
      newLoanId as number,
      oldLoanId
    );

    // 3. Handle leftover amount if any (New Loan -> Target Account)
    const leftover = newLoanAmount - oldLoan.amount;
    if (leftover > 0) {
      await dbAddTransaction(
        "대환대출 잔금 입금",
        leftover,
        "transfer",
        false,
        today,
        "대출",
        newLoanId as number,
        targetAssetId
      );
    }

    // 4. Update monthly repayment for the new loan
    if (monthlyPayment > 0) {
      await dbAddTransaction(
        `${newLoanName} 상환`,
        monthlyPayment,
        "transfer",
        true,
        today,
        "대출상환",
        targetAssetId,
        newLoanId as number
      );
    }

    await get().loadData();
  },
}));
