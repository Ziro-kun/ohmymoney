import { create } from 'zustand';
import { initializeDB, getAssets, getExpenses, addAsset, addExpense, loadDummyData, removeAsset, removeExpense } from '../db/sqlite';

export interface Asset {
  id: number;
  name: string;
  amount: number;
  type: 'asset' | 'liability';
}

export interface Expense {
  id: number;
  name: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

interface FinanceState {
  isInitialized: boolean;
  assets: Asset[];
  expenses: Expense[];
  
  // Computed (updated regularly)
  netWorth: number;
  dailyBurnRate: number; // How much it costs to live per day
  perSecondBurnRate: number; // Cost per second
  
  // Methods
  loadData: () => Promise<void>;
  addNewAsset: (name: string, amount: number, type: 'asset' | 'liability') => Promise<void>;
  addNewExpense: (name: string, amount: number, frequency: 'daily' | 'weekly' | 'monthly' | 'yearly') => Promise<void>;
  deleteAsset: (id: number) => Promise<void>;
  deleteExpense: (id: number) => Promise<void>;
  applyDummyData: () => Promise<void>;
}

import { DAYS_IN_MONTH, DAYS_IN_YEAR } from '../../constants/finance';

// Helpers for calculations
const calculateDailyBurn = (expenses: Expense[]) => {
  return expenses.reduce((total, exp) => {
    switch (exp.frequency) {
      case 'daily': return total + exp.amount;
      case 'weekly': return total + (exp.amount / 7);
      case 'monthly': return total + (exp.amount / DAYS_IN_MONTH);
      case 'yearly': return total + (exp.amount / DAYS_IN_YEAR);
      default: return total;
    }
  }, 0);
};

export const useFinanceStore = create<FinanceState>((set, get) => ({
  isInitialized: false,
  assets: [],
  expenses: [],
  netWorth: 0,
  dailyBurnRate: 0,
  perSecondBurnRate: 0,

  loadData: async () => {
    await initializeDB();
    const assetsData = (await getAssets()) as Asset[];
    const expensesData = (await getExpenses()) as Expense[];

    const netWorth = assetsData.reduce((total, asset) => {
      return asset.type === 'asset' ? total + asset.amount : total - asset.amount;
    }, 0);

    const dailyBurnRate = calculateDailyBurn(expensesData);
    const perSecondBurnRate = dailyBurnRate / (24 * 60 * 60);

    set({
      isInitialized: true,
      assets: assetsData,
      expenses: expensesData,
      netWorth,
      dailyBurnRate,
      perSecondBurnRate,
    });
  },

  addNewAsset: async (name, amount, type) => {
    try {
      const id = await addAsset(name, amount, type);
      const newAsset = { id, name, amount, type };
      set((state) => {
        const assets = [...state.assets, newAsset];
        const netWorth = assets.reduce((total, asset) => {
          return asset.type === 'asset' ? total + asset.amount : total - asset.amount;
        }, 0);
        return { assets, netWorth };
      });
    } catch (e) {
      throw e;
    }
  },

  addNewExpense: async (name, amount, frequency) => {
    try {
      const id = await addExpense(name, amount, frequency);
      const newExp = { id, name, amount, frequency };
      set((state) => {
        const expenses = [...state.expenses, newExp];
        const dailyBurnRate = calculateDailyBurn(expenses);
        const perSecondBurnRate = dailyBurnRate / (24 * 60 * 60);
        return { expenses, dailyBurnRate, perSecondBurnRate };
      });
    } catch (e) {
      throw e;
    }
  },

  deleteAsset: async (id: number) => {
    try {
      await removeAsset(id);
      set((state) => {
        const assets = state.assets.filter(a => a.id !== id);
        const netWorth = assets.reduce((total, asset) => {
          return asset.type === 'asset' ? total + asset.amount : total - asset.amount;
        }, 0);
        return { assets, netWorth };
      });
    } catch (e) {
      throw e;
    }
  },

  deleteExpense: async (id: number) => {
    try {
      await removeExpense(id);
      set((state) => {
        const expenses = state.expenses.filter(e => e.id !== id);
        const dailyBurnRate = calculateDailyBurn(expenses);
        const perSecondBurnRate = dailyBurnRate / (24 * 60 * 60);
        return { expenses, dailyBurnRate, perSecondBurnRate };
      });
    } catch (e) {
      throw e;
    }
  },

  applyDummyData: async () => {
    await loadDummyData();
    await get().loadData(); // Re-fetch UI
  }
}));
