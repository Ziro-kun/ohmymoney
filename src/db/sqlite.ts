import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

export const getDB = async () => {
  if (!db) {
    db = await SQLite.openDatabaseAsync("finance.db");
  }
  return db;
};

let initPromise: Promise<void> | null = null;

export const initializeDB = async () => {
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    const database = await getDB();
    console.log("Initializing database and checking schema...");

    try {
      // 1. Base assets table
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS assets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          amount REAL NOT NULL,
          type TEXT NOT NULL,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 2. Recurring expenses table
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          amount REAL NOT NULL,
          frequency TEXT NOT NULL,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 3. Transactions Schema Management
      const tableInfo = (await database.getAllAsync("PRAGMA table_info(transactions)")) as any[];
      
      if (tableInfo.length > 0) {
        const hasDescription = tableInfo.some((col) => col.name === "description");
        const hasAssetId = tableInfo.some((col) => col.name === "assetId");
        const hasToAssetId = tableInfo.some((col) => col.name === "toAssetId");

        // If missing modern fields, migrate
        if (!hasAssetId || !hasToAssetId) {
          console.log("Migrating transactions table to support asset linking and transfers...");
          
          await database.execAsync("ALTER TABLE transactions RENAME TO transactions_old;");
          
          await database.execAsync(`
            CREATE TABLE transactions (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              description TEXT NOT NULL,
              amount REAL NOT NULL,
              type TEXT NOT NULL,
              date TEXT DEFAULT CURRENT_TIMESTAMP,
              category TEXT,
              isFixed INTEGER DEFAULT 0,
              assetId INTEGER,
              toAssetId INTEGER
            );
          `);

          try {
            await database.execAsync(`
              INSERT INTO transactions (id, description, amount, type, date, category, isFixed)
              SELECT id, description, amount, type, date, category, isFixed
              FROM transactions_old;
            `);
          } catch (e) {
            console.warn("Migration copy failed, starting fresh transactions table", e);
          }
          
          await database.execAsync("DROP TABLE IF EXISTS transactions_old;");
        }
      } else {
        // Create table for the first time
        await database.execAsync(`
          CREATE TABLE transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            amount REAL NOT NULL,
            type TEXT NOT NULL,
            date TEXT DEFAULT CURRENT_TIMESTAMP,
            category TEXT,
            isFixed INTEGER DEFAULT 0,
            assetId INTEGER,
            toAssetId INTEGER
          );
        `);
      }
    } catch (err) {
      console.error("Critical database error:", err);
    }
  })();
  
  return initPromise;
};

// --- Assets ---
export const getAssets = async () => {
  const database = await getDB();
  return await database.getAllAsync("SELECT * FROM assets ORDER BY id DESC");
};

export const addAsset = async (name: string, amount: number, type: string) => {
  const database = await getDB();
  const statement = await database.prepareAsync(
    "INSERT INTO assets (name, amount, type) VALUES ($name, $amount, $type)",
  );
  try {
    const result = await statement.executeAsync({
      $name: name,
      $amount: amount,
      $type: type,
    });
    return result.lastInsertRowId;
  } finally {
    await statement.finalizeAsync();
  }
};

export const updateAsset = async (
  id: number,
  name: string,
  amount: number,
  type: string,
) => {
  const database = await getDB();
  await database.runAsync(
    "UPDATE assets SET name = ?, amount = ?, type = ? WHERE id = ?",
    [name, amount, type, id],
  );
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

export const addExpense = async (
  name: string,
  amount: number,
  frequency: string,
) => {
  const database = await getDB();
  const statement = await database.prepareAsync(
    "INSERT INTO expenses (name, amount, frequency) VALUES ($name, $amount, $frequency)",
  );
  try {
    const result = await statement.executeAsync({
      $name: name,
      $amount: amount,
      $frequency: frequency,
    });
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
  const results = (await database.getAllAsync(
    "SELECT * FROM transactions ORDER BY date DESC, id DESC",
  )) as any[];
  return results.map((tx) => ({
    ...tx,
    name: tx.description || tx.category || "내역 없음",
    isFixed: !!tx.isFixed,
  }));
};

export const addTransaction = async (
  name: string,
  amount: number,
  type: string,
  isFixed: boolean = false,
  date?: string,
  category?: string,
  assetId?: number,
  toAssetId?: number
) => {
  await initializeDB();
  const database = await getDB();
  const statement = await database.prepareAsync(
    "INSERT INTO transactions (description, amount, type, date, isFixed, category, assetId, toAssetId) VALUES ($desc, $amt, $type, $date, $fixed, $cat, $assetId, $toAssetId)",
  );
  try {
    const result = await statement.executeAsync({
      $desc: name,
      $amt: amount,
      $type: type,
      $date: date || new Date().toISOString().split("T")[0],
      $fixed: isFixed ? 1 : 0,
      $cat: category || "기타",
      $assetId: assetId || null,
      $toAssetId: toAssetId || null
    });
    return result.lastInsertRowId;
  } finally {
    await statement.finalizeAsync();
  }
};

export const updateTransaction = async (
  id: number,
  name: string,
  amount: number,
  type: string,
  isFixed: boolean = false,
  date?: string,
  category?: string,
  assetId?: number,
  toAssetId?: number
) => {
  const database = await getDB();
  await database.runAsync(
    "UPDATE transactions SET description = ?, amount = ?, type = ?, isFixed = ?, date = ?, category = ?, assetId = ?, toAssetId = ? WHERE id = ?",
    [name, amount, type, isFixed ? 1 : 0, date || new Date().toISOString().split("T")[0], category || "기타", assetId || null, toAssetId || null, id],
  );
};

export const removeTransaction = async (id: number) => {
  const database = await getDB();
  await database.runAsync("DELETE FROM transactions WHERE id = ?", [id]);
};

// --- Dummy Data ---
export const loadDummyData = async () => {
  await initializeDB();
  const database = await getDB();
  await database.execAsync(
    "DELETE FROM assets; DELETE FROM expenses; DELETE FROM transactions;",
  );

  const shId = await addAsset("주거래 은행 (신한)", 8000000, "asset");
  const tossId = await addAsset("주식 계좌 (토스)", 5000000, "asset");
  await addAsset("전세자금 대출", 50000000, "liability");

  await addTransaction("맥도날드 점심", 12000, "expense", false, undefined, "식비", shId as number);
  await addTransaction("전세대출 이자", 200000, "expense", true, undefined, "주거", shId as number);
  await addTransaction("월급 입금", 3500000, "income", false, undefined, "수입", shId as number);
  await addTransaction("넷플릭스 구독", 17000, "expense", true, undefined, "생활", tossId as number);
  await addTransaction("유튜브 프리미엄", 14900, "expense", true, undefined, "생활", tossId as number);
};
