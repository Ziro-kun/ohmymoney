import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { getDB } from "../db/sqlite";
import { Alert } from "react-native";

export const DataService = {
  /**
   * Export all user data to a JSON file and share it.
   */
  exportData: async () => {
    try {
      const db = await getDB();
      
      // Fetch all data from all relevant tables
      const assets = await db.getAllAsync("SELECT * FROM assets");
      const expenses = await db.getAllAsync("SELECT * FROM expenses");
      const transactions = await db.getAllAsync("SELECT * FROM transactions");
      const settings = await db.getAllAsync("SELECT * FROM settings");

      const backupData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        data: {
          assets,
          expenses,
          transactions,
          settings,
        },
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const filename = `ohmymoney_backup_${new Date().toISOString().split("T")[0]}.json`;
      
      // Use documentDirectory or cacheDirectory
      const dir = (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory;
      const fileUri = `${dir}${filename}`;

      // Write to a temporary file
      await FileSystem.writeAsStringAsync(fileUri, jsonString, {
        encoding: (FileSystem as any).EncodingType?.UTF8 || "utf8",
      });

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/json",
          dialogTitle: "ohmymoney 데이터 백업",
          UTI: "public.json",
        });
      } else {
        Alert.alert("알림", "공유 기능을 사용할 수 없는 기기입니다.");
      }
    } catch (error) {
      console.error("Export failed:", error);
      Alert.alert("오류", "데이터 내보내기에 실패했습니다.");
    }
  },

  /**
   * Import data from a selected JSON file.
   */
  importData: async () => {
    try {
      // 1. Pick a file
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return false;
      }

      const fileUri = result.assets[0].uri;
      const fileContent = await FileSystem.readAsStringAsync(fileUri);
      const backup = JSON.parse(fileContent);

      // 2. Validate basic structure
      if (!backup.data || !backup.data.assets || !backup.data.transactions) {
        throw new Error("Invalid backup file format");
      }

      const db = await getDB();
      
      // 3. Clear existing data and import new data (transactional-ish)
      await db.execAsync("BEGIN TRANSACTION;");
      try {
        // Clear tables
        await db.execAsync("DELETE FROM assets;");
        await db.execAsync("DELETE FROM expenses;");
        await db.execAsync("DELETE FROM transactions;");
        await db.execAsync("DELETE FROM settings;");

        // Restore Assets
        for (const asset of backup.data.assets) {
          await db.runAsync(
            "INSERT INTO assets (id, name, amount, type, assetCategory, depreciationRate, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [asset.id, asset.name, asset.amount, asset.type, asset.assetCategory, asset.depreciationRate, asset.createdAt]
          );
        }

        // Restore Expenses
        for (const expense of backup.data.expenses) {
          await db.runAsync(
            "INSERT INTO expenses (id, name, amount, frequency, createdAt) VALUES (?, ?, ?, ?, ?)",
            [expense.id, expense.name, expense.amount, expense.frequency, expense.createdAt]
          );
        }

        // Restore Transactions
        for (const tx of backup.data.transactions) {
          await db.runAsync(
            "INSERT INTO transactions (id, description, amount, type, date, category, isFixed, assetId, toAssetId, recurringDay) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [tx.id, tx.description, tx.amount, tx.type, tx.date, tx.category, tx.isFixed ? 1 : 0, tx.assetId, tx.toAssetId, tx.recurringDay]
          );
        }

        // Restore Settings
        for (const setting of backup.data.settings) {
          await db.runAsync(
            "INSERT INTO settings (key, value) VALUES (?, ?)",
            [setting.key, setting.value]
          );
        }

        await db.execAsync("COMMIT;");
        return true;
      } catch (innerError) {
        await db.execAsync("ROLLBACK;");
        throw innerError;
      }
    } catch (error) {
      console.error("Import failed:", error);
      Alert.alert("오류", "데이터 가져오기에 실패했습니다. 파일 형식을 확인해 주세요.");
      return false;
    }
  },
};
