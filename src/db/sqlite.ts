import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

export const getDB = async () => {
  if (!db) {
    db = await SQLite.openDatabaseAsync("finance.db");
  }
  return db;
};

export const initializeDB = async () => {
  const database = await getDB();

  // Base assets table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Recurring expenses table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      frequency TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Transactions table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL, -- 'income' | 'expense' | 'transfer'
      date TEXT DEFAULT CURRENT_TIMESTAMP,
      category TEXT,
      isFixed INTEGER DEFAULT 0 -- 0: false, 1: true
    );
  `);

  // Migration: Add isFixed to transactions if it doesn't exist (Safe for Android)
  try {
    const tableInfo = (await database.getAllAsync("PRAGMA table_info(transactions)")) as any[];
    const hasIsFixed = tableInfo.some((col) => col.name === "isFixed");
    if (!hasIsFixed) {
      await database.execAsync("ALTER TABLE transactions ADD COLUMN isFixed INTEGER DEFAULT 0;");
    }
  } catch (err) {
    console.log("Migration skipped or failed:", err);
  }
};

// --- Assets ---
export const getAssets = async () => {
  const database = await getDB();
  return await database.getAllAsync("SELECT * FROM assets ORDER BY id DESC");
};

export const addAsset = async (name: string, amount: number, type: string) => {
  const database = await getDB();
  const statement = await database.prepareAsync("INSERT INTO assets (name, amount, type) VALUES ($name, $amount, $type)");
  try {
    const result = await statement.executeAsync({ $name: name, $amount: amount, $type: type });
    return result.lastInsertRowId;
  } finally {
    await statement.finalizeAsync();
  }
};

export const updateAsset = async (id: number, name: string, amount: number, type: string) => {
  const database = await getDB();
  await database.runAsync("UPDATE assets SET name = ?, amount = ?, type = ? WHERE id = ?", [name, amount, type, id]);
};

export const removeAsset = async (id: number) => {
  const database = await getDB();
  await database.runAsync("DELETE FROM assets WHERE id = ?", [id]);
};

// --- Recurring Expenses ---
export const getExpenses = async () => {
  const database = await getDB();
  return await database.getAllAsync("SELECT * FROM expenses ORDER BY id DESC");
};

export const addExpense = async (name: string, amount: number, frequency: string) => {
  const database = await getDB();
  const statement = await database.prepareAsync("INSERT INTO expenses (name, amount, frequency) VALUES ($name, $amount, $frequency)");
  try {
    const result = await statement.executeAsync({ $name: name, $amount: amount, $frequency: frequency });
    return result.lastInsertRowId;
  } finally {
    await statement.finalizeAsync();
  }
};

export const removeExpense = async (id: number) => {
  const database = await getDB();
  await database.runAsync("DELETE FROM expenses WHERE id = ?", [id]);
};

// --- Transactions ---
export const getTransactions = async () => {
  const database = await getDB();
  const results = (await database.getAllAsync("SELECT * FROM transactions ORDER BY date DESC, id DESC")) as any[];
  return results.map((tx) => ({ ...tx, isFixed: !!tx.isFixed }));
};

export const addTransaction = async (description: string, amount: number, type: string, isFixed: boolean = false) => {
  const database = await getDB();
  const statement = await database.prepareAsync(
    "INSERT INTO transactions (description, amount, type, date, isFixed) VALUES ($desc, $amt, $type, $date, $fixed)"
  );
  try {
    const result = await statement.executeAsync({
      $desc: description,
      $amt: amount,
      $type: type,
      $date: new Date().toISOString().split("T")[0],
      $fixed: isFixed ? 1 : 0,
    });
    return result.lastInsertRowId;
  } finally {
    await statement.finalizeAsync();
  }
};

export const updateTransaction = async (id: number, description: string, amount: number, type: string, isFixed: boolean = false) => {
  const database = await getDB();
  await database.runAsync(
    "UPDATE transactions SET description = ?, amount = ?, type = ?, isFixed = ? WHERE id = ?",
    [description, amount, type, isFixed ? 1 : 0, id]
  );
};

export const removeTransaction = async (id: number) => {
  const database = await getDB();
  await database.runAsync("DELETE FROM transactions WHERE id = ?", [id]);
};

// --- Dummy Data ---
export const loadDummyData = async () => {
  const database = await getDB();
  await database.execAsync("DELETE FROM assets; DELETE FROM expenses; DELETE FROM transactions;");
  
  await addAsset("주거래 은행 (신한)", 25000000, "asset");
  await addAsset("주식 계좌 (토스)", 12500000, "asset");
  await addAsset("전세자금 대출", 50000000, "liability");

  await addTransaction("맥도날드 점심", 12000, "expense", false);
  await addTransaction("월세 납부", 500000, "expense", true);
  await addTransaction("월급 입금", 3500000, "income", false);
  await addTransaction("넷플릭스 구독", 17000, "expense", true);
};
展开
