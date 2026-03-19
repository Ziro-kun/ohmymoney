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
        const hasPaymentMethodId = tableInfo.some((col) => col.name === "paymentMethodId");

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
              recurringDay INTEGER,
              paymentMethodId INTEGER
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
        } else {
          if (!hasRecurringDay) {
            console.log("Adding recurringDay to transactions...");
            await database.execAsync("ALTER TABLE transactions ADD COLUMN recurringDay INTEGER;");
          }
          if (!hasPaymentMethodId) {
            console.log("Adding paymentMethodId to transactions...");
            await database.execAsync("ALTER TABLE transactions ADD COLUMN paymentMethodId INTEGER;");
          }
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
            recurringDay INTEGER,
            paymentMethodId INTEGER
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

      // 5. Payment Methods table
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS payment_methods (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('debit', 'credit', 'cash')),
          linkedAssetId INTEGER NOT NULL,
          billingDay INTEGER,
          billingAssetId INTEGER,
          color TEXT,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP
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

// --- Payment Methods ---
export const getPaymentMethods = async () => {
  const database = await getDB();
  return await database.getAllAsync("SELECT * FROM payment_methods ORDER BY id DESC");
};

export const addPaymentMethod = async (
  name: string,
  type: "debit" | "credit" | "cash",
  linkedAssetId: number,
  billingDay?: number | null,
  billingAssetId?: number | null,
  color?: string | null
) => {
  const database = await getDB();
  const statement = await database.prepareAsync(
    "INSERT INTO payment_methods (name, type, linkedAssetId, billingDay, billingAssetId, color) VALUES ($name, $type, $linkedAssetId, $billingDay, $billingAssetId, $color)",
  );
  try {
    const result = await statement.executeAsync({
      $name: name,
      $type: type,
      $linkedAssetId: linkedAssetId,
      $billingDay: billingDay || null,
      $billingAssetId: billingAssetId || null,
      $color: color || null,
    });
    return result.lastInsertRowId;
  } finally {
    await statement.finalizeAsync();
  }
};

export const updatePaymentMethod = async (
  id: number,
  name: string,
  type: "debit" | "credit" | "cash",
  linkedAssetId: number,
  billingDay?: number | null,
  billingAssetId?: number | null,
  color?: string | null
) => {
  const database = await getDB();
  await database.runAsync(
    "UPDATE payment_methods SET name = ?, type = ?, linkedAssetId = ?, billingDay = ?, billingAssetId = ?, color = ? WHERE id = ?",
    [name, type, linkedAssetId, billingDay || null, billingAssetId || null, color || null, id],
  );
};

export const removePaymentMethod = async (id: number) => {
  const database = await getDB();
  await database.runAsync("DELETE FROM payment_methods WHERE id = ?", [id]);
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
  recurringDay?: number | null,
  paymentMethodId?: number | null
) => {
  await initializeDB();
  const database = await getDB();
  const statement = await database.prepareAsync(
    "INSERT INTO transactions (description, amount, type, date, isFixed, category, assetId, toAssetId, recurringDay, paymentMethodId) VALUES ($desc, $amt, $type, $date, $fixed, $cat, $assetId, $toAssetId, $recurringDay, $paymentMethodId)",
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
      $recurringDay: recurringDay || null,
      $paymentMethodId: paymentMethodId || null
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
  recurringDay?: number | null,
  paymentMethodId?: number | null
) => {
  const database = await getDB();
  await database.runAsync(
    "UPDATE transactions SET description = ?, amount = ?, type = ?, isFixed = ?, date = ?, category = ?, assetId = ?, toAssetId = ?, recurringDay = ?, paymentMethodId = ? WHERE id = ?",
    [name, amount, type, isFixed ? 1 : 0, date || new Date().toISOString().split("T")[0], category || "기타", assetId || null, toAssetId || null, recurringDay || null, paymentMethodId || null, id],
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
    "DELETE FROM assets; DELETE FROM expenses; DELETE FROM transactions; DELETE FROM payment_methods;",
  );

  const shId = await addAsset("주거래 은행 (신한)", 8000000, "asset", "cash");
  const tossId = await addAsset("주식 계좌 (토스)", 5000000, "asset", "stock");
  const savingId = await addAsset("청약 저축 (우리)", 10000000, "asset", "deposit");
  const carId = await addAsset("자가용 (아반떼)", 15000000, "asset", "vehicle", 10);
  
  const jeonseId = await addAsset("전세자금 대출", 50000000, "liability", "loan", 4.8);
  const creditId = await addAsset("신용 대출", 30000000, "liability", "loan", 8.5);

  const shinhanCardId = await addPaymentMethod("신한 Deep Dream", "credit", creditId as number, 25, shId as number, "#1E3A8A");
  const tossCardId = await addPaymentMethod("토스뱅크 체크카드", "debit", tossId as number, null, null, "#2563EB");


  const today = new Date();
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
  const lastMonthStr = lastMonth.toISOString().split("T")[0];
  const todayStr = today.toISOString().split("T")[0];

  // 1회성 내역 (새로운 계층형 카테고리 라벨 적용, 결제수단 연동)
  await addTransaction("맥도날드 점심", 12500, "expense", false, todayStr, "식사", creditId as number, undefined, null, shinhanCardId as number);
  await addTransaction("스타벅스 커피", 6500, "expense", false, todayStr, "카페/음료", tossId as number, undefined, null, tossCardId as number);
  await addTransaction("올리브영 쇼핑", 45000, "expense", false, todayStr, "쇼핑", creditId as number, undefined, null, shinhanCardId as number);
  await addTransaction("치과 진료", 28500, "expense", false, lastMonthStr, "병원/약국", tossId as number, undefined, null, tossCardId as number);
  await addTransaction("주유 (SK에너지)", 65000, "expense", false, lastMonthStr, "주유/자동차", creditId as number, undefined, null, shinhanCardId as number);
  await addTransaction("교보문고 북쇼핑", 32000, "expense", false, lastMonthStr, "도서/교육", tossId as number, undefined, null, tossCardId as number);
  await addTransaction("유니클로 의류", 89000, "expense", false, lastMonthStr, "뷰티/패션", creditId as number, undefined, null, shinhanCardId as number);
  await addTransaction("전기요금 납부", 42000, "expense", false, todayStr, "공과금", shId as number); // 계좌 즉시출금 가정
  await addTransaction("통신비 (SKT)", 55000, "expense", false, todayStr, "통신비", creditId as number, undefined, null, shinhanCardId as number);
  await addTransaction("헬스장 정기권", 330000, "expense", false, lastMonthStr, "운동/헬스", creditId as number, undefined, null, shinhanCardId as number);
  await addTransaction("중고 당근 판매", 150000, "income", false, todayStr, "중고거래", shId as number);

  // 정기 내역 (과거 날짜를 등록일로 하여 가상 트랜잭션이 발생하도록 유도)
  await addTransaction("월급 입금", 3800000, "income", true, "2024-01-01", "급여", shId as number, undefined, 25);
  await addTransaction("청약 저축", 100000, "transfer", true, "2024-01-01", "저축/적금", shId as number, savingId as number, 25);
  await addTransaction("넷플릭스", 17000, "expense", true, "2024-01-01", "정기구독/OTT", creditId as number, undefined, 15, shinhanCardId as number);
  await addTransaction("유튜브 프리미엄", 14900, "expense", true, "2024-01-01", "정기구독/OTT", tossId as number, undefined, 1, tossCardId as number);
  await addTransaction("아파트 관리비", 210000, "expense", true, "2024-01-01", "관리비/월세", shId as number, undefined, 10);
  await addTransaction("대출 원금 상환", 500000, "transfer", true, "2024-01-01", "대출상환", shId as number, creditId as number, 15);
};

// --- Data Management (Repository Pattern) ---

/**
 * Restore the entire database from a backup object.
 */
export const restoreDatabase = async (backupData: any) => {
  const database = await getDB();
  await database.execAsync("BEGIN TRANSACTION;");
  try {
    // Clear existing data
    await database.execAsync("DELETE FROM assets;");
    await database.execAsync("DELETE FROM expenses;");
    await database.execAsync("DELETE FROM transactions;");
    await database.execAsync("DELETE FROM settings;");
    await database.execAsync("DELETE FROM payment_methods;");

    // Restore Assets
    for (const asset of backupData.data.assets || []) {
      await database.runAsync(
        "INSERT INTO assets (id, name, amount, type, assetCategory, depreciationRate, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [asset.id, asset.name, asset.amount, asset.type, asset.assetCategory, asset.depreciationRate, asset.createdAt]
      );
    }

    // Restore Expenses
    for (const expense of backupData.data.expenses || []) {
      await database.runAsync(
        "INSERT INTO expenses (id, name, amount, frequency, createdAt) VALUES (?, ?, ?, ?, ?)",
        [expense.id, expense.name, expense.amount, expense.frequency, expense.createdAt]
      );
    }
    
    // Restore Payment Methods
    for (const pm of backupData.data.payment_methods || []) {
      await database.runAsync(
        "INSERT INTO payment_methods (id, name, type, linkedAssetId, billingDay, billingAssetId, color, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [pm.id, pm.name, pm.type, pm.linkedAssetId, pm.billingDay, pm.billingAssetId, pm.color, pm.createdAt]
      );
    }

    // Restore Transactions
    for (const tx of backupData.data.transactions || []) {
      await database.runAsync(
        "INSERT INTO transactions (id, description, amount, type, date, category, isFixed, assetId, toAssetId, recurringDay, paymentMethodId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [tx.id, tx.description, tx.amount, tx.type, tx.date, tx.category, tx.isFixed ? 1 : 0, tx.assetId, tx.toAssetId, tx.recurringDay, tx.paymentMethodId]
      );
    }

    // Restore Settings
    for (const setting of backupData.data.settings || []) {
      await database.runAsync(
        "INSERT INTO settings (key, value) VALUES (?, ?)",
        [setting.key, setting.value]
      );
    }

    await database.execAsync("COMMIT;");
  } catch (error) {
    await database.execAsync("ROLLBACK;");
    console.error("Database restoration failed:", error);
    throw error;
  }
};

/**
 * Bulk import transactions into the database.
 */
export const importTransactions = async (transactions: any[]) => {
  const database = await getDB();
  await database.execAsync("BEGIN TRANSACTION;");
  try {
    for (const tx of transactions) {
      await database.runAsync(
        "INSERT INTO transactions (description, amount, type, date, category, isFixed, assetId, toAssetId, recurringDay, paymentMethodId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [tx.description, tx.amount, tx.type, tx.date, tx.category, tx.isFixed, tx.assetId, tx.toAssetId, tx.recurringDay, tx.paymentMethodId]
      );
    }
    await database.execAsync("COMMIT;");
  } catch (error) {
    await database.execAsync("ROLLBACK;");
    console.error("Bulk transaction import failed:", error);
    throw error;
  }
};
/**
 * Clear all data from the database.
 */
export const clearAllData = async () => {
  const database = await getDB();
  await database.execAsync(
    "DELETE FROM assets; DELETE FROM expenses; DELETE FROM transactions; DELETE FROM settings; DELETE FROM payment_methods;"
  );
};
