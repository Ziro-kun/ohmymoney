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
  ) => Promise<void>;
  updateAsset: (
    id: number,
    name: string,
    amount: number,
    type: "asset" | "liability",
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
}

import { DAYS_IN_MONTH, DAYS_IN_YEAR } from "../../constants/finance";

// Helpers for calculations
const calculateDailyBurn = (
  expenses: Expense[] = [],
  transactions: Transaction[] = [],
) => {
  const expenseBurn = expenses.reduce((total, exp) => {
    switch (exp.frequency) {
      case "daily":
        return total + exp.amount;
      case "weekly":
        return total + exp.amount / 7;
      case "monthly":
        return total + exp.amount / DAYS_IN_MONTH;
      case "yearly":
        return total + exp.amount / DAYS_IN_YEAR;
      default:
        return total;
    }
  }, 0);

  const txBurn = transactions.reduce((total, tx) => {
    if (tx.isFixed && tx.type === "expense") {
      return total + tx.amount / DAYS_IN_MONTH;
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
        if (tx.assetId === asset.id) {
          if (tx.type === "income") return change + tx.amount;
          if (tx.type === "expense") return change - tx.amount;
          if (tx.type === "transfer") return change - tx.amount;
        }
        if (tx.toAssetId === asset.id) {
          if (tx.type === "transfer") return change + tx.amount;
        }
        return change;
      }, 0);
      return { ...asset, amount: asset.amount + balanceChange };
    });

    const netWorth = updatedAssets.reduce((total, asset) => {
      return asset.type === "asset"
        ? total + asset.amount
        : total - asset.amount;
    }, 0);

    const rawDailyBurnRate = calculateDailyBurn(expensesData, transactionsData);
    const dailyBurnRate = Number(rawDailyBurnRate.toFixed(1));
    const perSecondBurnRate = rawDailyBurnRate / (24 * 60 * 60);

    set({
      isInitialized: true,
      assets: updatedAssets,
      expenses: expensesData,
      transactions: transactionsData as Transaction[],
      netWorth,
      dailyBurnRate,
      perSecondBurnRate,
    });
  },

  addAsset: async (name, amount, type) => {
    await addAsset(name, amount, type);
    await get().loadData();
  },

  updateAsset: async (id, name, amount, type) => {
    await updateAsset(id, name, amount, type);
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
}));
