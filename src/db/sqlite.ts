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
      const assetTableInfo = (await database.getAllAsync("PRAGMA table_info(assets)")) as any[];
      if (assetTableInfo.length > 0) {
        const hasCategory = assetTableInfo.some((col) => col.name === "assetCategory");
        if (!hasCategory) {
          console.log("Migrating assets table to support assetCategory and depreciationRate...");
          await database.execAsync("ALTER TABLE assets ADD COLUMN assetCategory TEXT;");
          await database.execAsync("ALTER TABLE assets ADD COLUMN depreciationRate REAL;");
        }
      } else {
        await database.execAsync(`
          CREATE TABLE IF NOT EXISTS assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            amount REAL NOT NULL,
            type TEXT NOT NULL,
            assetCategory TEXT,
            depreciationRate REAL,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
          );
        `);
      }

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
        const hasRecurringDay = tableInfo.some((col) => col.name === "recurringDay");

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
              toAssetId INTEGER,
              recurringDay INTEGER
            );
          `);

          try {
            // Check if 'name' exists in old table to decide what to copy to 'description'
            const oldTableInfo = (await database.getAllAsync(`PRAGMA table_info(transactions_old)`)) as any[];
            const hasOldName = oldTableInfo.some((col) => col.name === "name");
            
            const descCol = hasOldName ? "name" : "description";
            
            await database.execAsync(`
              INSERT INTO transactions (id, description, amount, type, date, category, isFixed)
              SELECT id, ${descCol}, amount, type, date, category, isFixed
              FROM transactions_old;
            `);
          } catch (e) {
            console.warn("Migration copy failed, starting fresh transactions table", e);
          }
          
          await database.execAsync("DROP TABLE IF EXISTS transactions_old;");
        } else if (!hasRecurringDay) {
          console.log("Adding recurringDay to transactions...");
          await database.execAsync("ALTER TABLE transactions ADD COLUMN recurringDay INTEGER;");
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
            toAssetId INTEGER,
            recurringDay INTEGER
          );
        `);
      }
      // 4. Settings table
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);
    } catch (err) {
      console.error("Critical database error:", err);
    }
  })();
  
  return initPromise;
};

// --- Settings ---
export const getSetting = async (key: string, defaultValue: string) => {
  const database = await getDB();
  const result = await database.getFirstAsync<{ value: string }>("SELECT value FROM settings WHERE key = ?", [key]);
  return result ? result.value : defaultValue;
};

export const updateSetting = async (key: string, value: string) => {
  const database = await getDB();
  await database.runAsync("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", [key, value]);
};

// --- Assets ---
export const getAssets = async () => {
  const database = await getDB();
  return await database.getAllAsync("SELECT * FROM assets ORDER BY id DESC");
};

export const addAsset = async (name: string, amount: number, type: string, assetCategory?: string, depreciationRate?: number) => {
  const database = await getDB();
  const statement = await database.prepareAsync(
    "INSERT INTO assets (name, amount, type, assetCategory, depreciationRate) VALUES ($name, $amount, $type, $assetCategory, $depreciationRate)",
  );
  try {
    const result = await statement.executeAsync({
      $name: name,
      $amount: amount,
      $type: type,
      $assetCategory: assetCategory || null,
      $depreciationRate: depreciationRate || null,
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
  assetCategory?: string,
  depreciationRate?: number,
) => {
  const database = await getDB();
  await database.runAsync(
    "UPDATE assets SET name = ?, amount = ?, type = ?, assetCategory = ?, depreciationRate = ? WHERE id = ?",
    [name, amount, type, assetCategory || null, depreciationRate || null, id],
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
  toAssetId?: number,
  recurringDay?: number | null
) => {
  await initializeDB();
  const database = await getDB();
  const statement = await database.prepareAsync(
    "INSERT INTO transactions (description, amount, type, date, isFixed, category, assetId, toAssetId, recurringDay) VALUES ($desc, $amt, $type, $date, $fixed, $cat, $assetId, $toAssetId, $recurringDay)",
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
      $toAssetId: toAssetId || null,
      $recurringDay: recurringDay || null
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
  toAssetId?: number,
  recurringDay?: number | null
) => {
  const database = await getDB();
  await database.runAsync(
    "UPDATE transactions SET description = ?, amount = ?, type = ?, isFixed = ?, date = ?, category = ?, assetId = ?, toAssetId = ?, recurringDay = ? WHERE id = ?",
    [name, amount, type, isFixed ? 1 : 0, date || new Date().toISOString().split("T")[0], category || "기타", assetId || null, toAssetId || null, recurringDay || null, id],
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

  const shId = await addAsset("주거래 은행 (신한)", 8000000, "asset", "cash");
  const tossId = await addAsset("주식 계좌 (토스)", 5000000, "asset", "stock");
  const savingId = await addAsset("청약 저축 (우리)", 10000000, "asset", "deposit");
  const carId = await addAsset("자가용 (아반떼)", 15000000, "asset", "vehicle", 10);
  
  const jeonseId = await addAsset("전세자금 대출", 50000000, "liability", "loan", 4.8);
  const creditId = await addAsset("신용 대출", 10000000, "liability", "loan", 8.5);

  const today = new Date();
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
  const lastMonthStr = lastMonth.toISOString().split("T")[0];
  const todayStr = today.toISOString().split("T")[0];

  // 1회성 내역
  await addTransaction("맥도날드 점심", 12000, "expense", false, todayStr, "식비", shId as number);
  await addTransaction("주유소", 50000, "expense", false, lastMonthStr, "교통", shId as number);
  await addTransaction("중고거래 판매", 150000, "income", false, todayStr, "수입", shId as number);

  // 정기 내역 (과거 날짜를 등록일로 하여 가상 트랜잭션이 발생하도록 유도)
  // 대출 이자는 자산(부채)의 이자율 기반으로 자동 계산(Cascade)되므로 별도의 정기 지출 트랜잭션에서 제외
  await addTransaction("월급 입금", 3500000, "income", true, lastMonthStr, "수입", shId as number, undefined, 25);
  await addTransaction("신용대출 상환(원금)", 300000, "transfer", true, lastMonthStr, "이체", shId as number, creditId as number, 15);
  await addTransaction("청약 저축(자동이체)", 100000, "transfer", true, lastMonthStr, "이체", shId as number, savingId as number, 25);
  
  await addTransaction("넷플릭스 구독", 17000, "expense", true, lastMonthStr, "생활", tossId as number, undefined, 15);
  await addTransaction("유튜브 프리미엄", 14900, "expense", true, lastMonthStr, "생활", tossId as number, undefined, 1);
};
