import { getDB, restoreDatabase, importTransactions, initializeDB } from "../db/sqlite";
import { Alert } from "react-native";
import { FileHelper } from "../utils/FileHelper";
import { DataParser } from "../utils/DataParser";

export const DataService = {
  /**
   * Export all user data to a JSON file and share it.
   */
  exportData: async () => {
    try {
      const db = await getDB();
      
      const assets = await db.getAllAsync("SELECT * FROM assets");
      const expenses = await db.getAllAsync("SELECT * FROM expenses");
      const transactions = await db.getAllAsync("SELECT * FROM transactions");
      const settings = await db.getAllAsync("SELECT * FROM settings");

      const backupData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        data: { assets, expenses, transactions, settings },
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const filename = `ohmymoney_backup_${new Date().toISOString().split("T")[0]}.json`;
      
      await FileHelper.saveAndShareFile(
        jsonString, 
        filename, 
        "application/json", 
        "public.json"
      );
      return true;
    } catch (error) {
      console.error("Export failed:", error);
      throw error;
    }
  },

  /**
   * Import data from a selected JSON file.
   */
  importData: async () => {
    try {
      const fileContent = await FileHelper.pickAndReadFile("application/json");
      if (!fileContent) return false;

      const backup = DataParser.parseBackupJSON(fileContent);
      await restoreDatabase(backup);
      return true;
    } catch (error) {
      console.error("Import failed:", error);
      throw error;
    }
  },

  /**
   * Export a CSV template for transactions.
   */
  exportCSVTemplate: async () => {
    try {
      await initializeDB();
      const db = await getDB();
      const assets: any[] = await db.getAllAsync("SELECT id, name FROM assets").catch(() => []);
      
      const header = "날짜(YYYY-MM-DD),내용,금액,구분(income/expense/transfer),카테고리,출금자산ID,입금자산ID(이체시),고정지출(0/1),정기결제일(1-31)\n";
      const todayStr = new Date().toISOString().split("T")[0];
      let rows = `${todayStr},샘플 지출,5000,expense,식비,${assets[0]?.id || 1},,0,\n`;
      rows += `${todayStr},샘플 수입,2000000,income,월급,${assets[0]?.id || 1},,0,\n`;
      
      let reference = "\n\n# [참고] 현재 등록된 자산 ID 목록\n# ID, 자산이름\n";
      assets.forEach(a => { reference += `# ${a.id}, ${a.name}\n`; });

      const csvContent = header + rows + reference;

      // Directly save and share the file (Local File focus)
      await FileHelper.saveAndShareFile(
        csvContent,
        'ohmymoney_template.csv',
        'text/csv',
        'public.comma-separated-values'
      );
      return true;
    } catch (error) {
      console.error("CSV Template Export failed:", error);
      throw error;
    }
  },

  /**
   * Import transactions from a CSV file.
   */
  importCSV: async () => {
    try {
      const fileContent = await FileHelper.pickAndReadFile(["text/csv", "text/comma-separated-values"]);
      if (!fileContent) return false;

      const transactions = DataParser.parseCSVToTransactions(fileContent);
      if (transactions.length === 0) {
        Alert.alert("알림", "가져올 유효한 데이터가 없습니다.");
        return false;
      }

      await importTransactions(transactions);
      return true;
    } catch (error) {
      console.error("CSV Import failed:", error);
      throw error;
    }
  },
};
