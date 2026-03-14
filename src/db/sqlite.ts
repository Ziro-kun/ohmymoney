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
        const hasName = tableInfo.some((col) => col.name === "name");
        const hasIsFixed = tableInfo.some((col) => col.name === "isFixed");

        // IF 'name' column exists or 'description' is missing, it's an old schema.
        // We MUST migrate to avoid NOT NULL constraint errors on the hidden 'name' column.
        if (hasName || !hasDescription || !hasIsFixed) {
          console.log("Detected old transactions schema. Rebuilding table...");
          
          // Move existing data to backup
          await database.execAsync("ALTER TABLE transactions RENAME TO transactions_old;");
          
          // Create new table with correct schema
          await database.execAsync(`
            CREATE TABLE transactions (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              description TEXT NOT NULL,
              amount REAL NOT NULL,
              type TEXT NOT NULL,
              date TEXT DEFAULT CURRENT_TIMESTAMP,
              category TEXT,
              isFixed INTEGER DEFAULT 0
            );
          `);

          // Restore data if possible
          try {
            const sourceCol = hasName ? "name" : (hasDescription ? "description" : "'내역 없음'");
            await database.execAsync(`
              INSERT INTO transactions (id, description, amount, type, date, category, isFixed)
              SELECT id, ${sourceCol}, amount, type, date, category, ${hasIsFixed ? "isFixed" : "0"}
              FROM transactions_old;
            `);
            console.log("Data migrated successfully.");
          } catch (migrationErr) {
            console.warn("Could not migrate old data, starting fresh:", migrationErr);
          }

          // Clean up
          await database.execAsync("DROP TABLE transactions_old;");
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
            isFixed INTEGER DEFAULT 0
          );
        `);
      }
    } catch (err) {
      console.error("Critical database error:", err);
      // As a last resort, if schema is totally broken, wipe and start over (only for transactions)
      try {
        await database.execAsync("DROP TABLE IF EXISTS transactions;");
        await database.execAsync(`
          CREATE TABLE transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            amount REAL NOT NULL,
            type TEXT NOT NULL,
            date TEXT DEFAULT CURRENT_TIMESTAMP,
            category TEXT,
            isFixed INTEGER DEFAULT 0
          );
        `);
      } catch (e) {
        console.error("Failed to recover database:", e);
      }
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
) => {
  await initializeDB();
  const database = await getDB();
  const statement = await database.prepareAsync(
    "INSERT INTO transactions (description, amount, type, date, isFixed) VALUES ($desc, $amt, $type, $date, $fixed)",
  );
  try {
    const result = await statement.executeAsync({
      $desc: name,
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

export const updateTransaction = async (
  id: number,
  name: string,
  amount: number,
  type: string,
  isFixed: boolean = false,
) => {
  const database = await getDB();
  await database.runAsync(
    "UPDATE transactions SET description = ?, amount = ?, type = ?, isFixed = ? WHERE id = ?",
    [name, amount, type, isFixed ? 1 : 0, id],
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

  await addAsset("주거래 은행 (신한)", 8000000, "asset");
  await addAsset("주식 계좌 (토스)", 5000000, "asset");
  await addAsset("전세자금 대출", 50000000, "liability");

  await addTransaction("맥도날드 점심", 12000, "expense", false);
  await addTransaction("전세대출 이자", 200000, "expense", true);
  await addTransaction("월급 입금", 3500000, "income", false);
  await addTransaction("넷플릭스 구독", 17000, "expense", true);
  await addTransaction("유튜브 프리미엄", 14900, "expense", true);
};
