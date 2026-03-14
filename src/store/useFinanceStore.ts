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
} from "../db/sqlite";

export interface Asset {
  id: number;
  name: string;
  amount: number;
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
    toAssetId?: number
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
    toAssetId?: number
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
}

import { DAYS_IN_MONTH, DAYS_IN_YEAR } from "../../constants/finance";

// Helpers for calculations
const calculateDailyBurn = (
  expenses: Expense[] = [],
  transactions: Transaction[] = [],
) => {
  const expenseBurn = expenses.reduce((total, exp) => {
    const amt = Number(exp.amount) || 0;
    switch (exp.frequency) {
      case "daily":
        return total + amt;
      case "weekly":
        return total + amt / 7;
      case "monthly":
        return total + amt / DAYS_IN_MONTH;
      case "yearly":
        return total + amt / DAYS_IN_YEAR;
      default:
        return total;
    }
  }, 0);

  const txBurn = transactions.reduce((total, tx) => {
    const amt = Number(tx.amount) || 0;
    if (tx.isFixed && tx.type === "expense") {
      return total + amt / DAYS_IN_MONTH;
    }
    return total;
  }, 0);

  return expenseBurn + txBurn;
};

export const useFinanceStore = create<FinanceState>((set, get) => ({
  isInitialized: false,
  assets: [],
  expenses: [],
  transactions: [],
  netWorth: 0,
  dailyBurnRate: 0,
  perSecondBurnRate: 0,

  loadData: async () => {
    await initializeDB();
    const assetsData = (await getAssets()) as Asset[];
    const expensesData = (await getExpenses()) as Expense[];
    const transactionsData = (await getTransactions()) as any[];

    // Only historical or today's transactions affect current asset balances
    const today = new Date().toISOString().split("T")[0];
    const effectiveTxs = transactionsData.filter(tx => tx.date <= today);

    // Calculate current balances for each asset by applying transaction history to seed amounts
    const updatedAssets = assetsData.map(asset => {
      const balanceChange = effectiveTxs.reduce((change, tx) => {
        const txAmt = Number(tx.amount) || 0;
        // 1. From this asset
        if (tx.assetId === asset.id) {
          if (tx.type === "income") return change + txAmt;
          if (tx.type === "expense") return change - txAmt;
          // For Liability, "transferring out" means borrowing more
          if (tx.type === "transfer") {
            return asset.type === "liability" ? change + txAmt : change - txAmt;
          }
        }
        // 2. To this asset
        if (tx.toAssetId === asset.id) {
          // For Liability, "receiving transfer" means repayment (balance goes down)
          if (tx.type === "transfer") {
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
        // SQLite CURRENT_TIMESTAMP is UTC. Ensure JS treats it as UTC by appending 'Z'
        const dateStr = asset.createdAt ? (asset.createdAt.includes(" ") ? asset.createdAt.replace(" ", "T") + "Z" : asset.createdAt) : null;
        const createdAt = dateStr ? new Date(dateStr) : now;
        
        // Calculate diff in days to avoid millisecond-level jitter and timezone issues on day 0
        const diffInMs = now.getTime() - createdAt.getTime();
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
        
        if (diffInDays > 0) {
          const yearsElapsed = diffInDays / 365;
          const rate = Number(asset.depreciationRate) || 0;
          const depreciation = currentAmt * (rate / 100) * yearsElapsed;
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

    const rawDailyBurnRate = calculateDailyBurn(expensesData, transactionsData);
    const dailyBurnRate = Number(rawDailyBurnRate.toFixed(1));
    const perSecondBurnRate = rawDailyBurnRate / (24 * 60 * 60);

    set({
      isInitialized: true,
      assets: depreciatedAssets,
      expenses: expensesData,
      transactions: transactionsData as Transaction[],
      netWorth,
      dailyBurnRate,
      perSecondBurnRate,
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

  addTransaction: async (name, amount, type, isFixed, date, category, assetId, toAssetId) => {
    await dbAddTransaction(name, amount, type, isFixed, date, category, assetId, toAssetId);
    await get().loadData();
  },

  updateTransaction: async (id, name, amount, type, isFixed, date, category, assetId, toAssetId) => {
    await dbUpdateTransaction(id, name, amount, type, isFixed, date, category, assetId, toAssetId);
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
