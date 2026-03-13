import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export const getDB = async () => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('finance.db');
  }
  return db;
};

export const initializeDB = async () => {
  const database = await getDB();
  
  // Base assets: track current total net worth or starting balance
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL, -- 'asset' | 'liability'
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Fixed recurring expenses: to calculate the burn rate
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      frequency TEXT NOT NULL, -- 'daily' | 'weekly' | 'monthly' | 'yearly'
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

// --- Helper Functions ---

export const getAssets = async () => {
  try {
    const database = await getDB();
    return await database.getAllAsync('SELECT * FROM assets');
  } catch (err) {
    console.error("Failed to get assets:", err);
    throw err;
  }
};

export const addAsset = async (name: string, amount: number, type: 'asset' | 'liability'): Promise<number> => {
  const database = await getDB();
  const statement = await database.prepareAsync('INSERT INTO assets (name, amount, type) VALUES ($name, $amount, $type)');
  try {
    const result = await statement.executeAsync({ $name: name, $amount: amount, $type: type });
    return result.lastInsertRowId;
  } catch (err) {
    console.error("Failed to add asset:", err);
    throw err;
  } finally {
    await statement.finalizeAsync();
  }
};

export const getExpenses = async () => {
  try {
    const database = await getDB();
    return await database.getAllAsync('SELECT * FROM expenses');
  } catch (err) {
    console.error("Failed to get expenses:", err);
    throw err;
  }
};

export const addExpense = async (name: string, amount: number, frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'): Promise<number> => {
  const database = await getDB();
  const statement = await database.prepareAsync('INSERT INTO expenses (name, amount, frequency) VALUES ($name, $amount, $frequency)');
  try {
    const result = await statement.executeAsync({ $name: name, $amount: amount, $frequency: frequency });
    return result.lastInsertRowId;
  } catch (err) {
    console.error("Failed to add expense:", err);
    throw err;
  } finally {
    await statement.finalizeAsync();
  }
};

export const loadDummyData = async () => {
  try {
    const database = await getDB();
    
    // Clear existing
    await database.execAsync('DELETE FROM assets; DELETE FROM expenses;');

  // Insert dummy assets
  await addAsset('주거래 은행 (신한)', 25000000, 'asset');
  await addAsset('주식 계좌 (토스)', 12500000, 'asset');
  await addAsset('전세자금 대출', 50000000, 'liability');

  // Insert dummy expenses
  await addExpense('점심 식대 (평균)', 15000, 'daily');
  await addExpense('커피 (평균)', 5000, 'daily');
  await addExpense('넷플릭스 프리미엄', 17000, 'monthly');
  await addExpense('유튜브 프리미엄', 14900, 'monthly');
  await addExpense('통신비 (SKT)', 65000, 'monthly');
  await addExpense('주택 관리비', 150000, 'monthly');
  await addExpense('전세대출 이자', 200000, 'monthly');
  } catch (err) {
    console.error("Failed to load dummy data:", err);
    throw err;
  }
};

export const removeAsset = async (id: number) => {
  try {
    const database = await getDB();
    await database.runAsync('DELETE FROM assets WHERE id = ?', [id]);
  } catch (err) {
    console.error("Failed to remove asset:", err);
    throw err;
  }
};

export const removeExpense = async (id: number) => {
  try {
    const database = await getDB();
    await database.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
  } catch (err) {
    console.error("Failed to remove expense:", err);
    throw err;
  }
};
