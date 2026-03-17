export const DataParser = {
  /**
   * Parse a JSON backup string and validate its basic structure.
   */
  parseBackupJSON: (jsonString: string) => {
    try {
      const backup = JSON.parse(jsonString);
      if (!backup.data || !backup.data.assets || !backup.data.transactions) {
        throw new Error("유효하지 않은 백업 파일 형식입니다.");
      }
      return backup;
    } catch (error) {
      console.error("JSON parsing/validation failed:", error);
      throw new Error("백업 파일을 파싱하는 데 실패했습니다.");
    }
  },

  /**
   * Parse a CSV string into an array of transaction objects.
   * Handles commas within quoted values correctly.
   */
  parseCSVToTransactions: (csvString: string) => {
    const lines = csvString.split(/\r?\n/);
    const transactions = [];

    // Skip header and process lines
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith("#")) continue;

      // Robust CSV parsing to handle commas inside quotes if they exist
      // Simple regex for splitting by comma but respecting quotes: 
      // /,(?=(?:(?:[^"]*"){2})*[^"]*$)/
      const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => {
        let clean = col.trim();
        if (clean.startsWith('"') && clean.endsWith('"')) {
          clean = clean.substring(1, clean.length - 1).replace(/""/g, '"');
        }
        return clean;
      });

      if (cols.length < 3) continue;

      // Expected Order: Date,Description,Amount,Type,Category,AssetID,ToAssetID,IsFixed,RecurringDay
      transactions.push({
        date: cols[0] || new Date().toISOString().split("T")[0],
        description: cols[1] || "CSV 가져오기",
        amount: parseInt(cols[2] || "0", 10),
        type: cols[3] || "expense",
        category: cols[4] || "",
        assetId: cols[5] ? parseInt(cols[5], 10) : null,
        toAssetId: cols[6] ? parseInt(cols[6], 10) : null,
        isFixed: cols[7] === "1" ? 1 : 0,
        recurringDay: cols[8] ? parseInt(cols[8], 10) : null,
      });
    }

    return transactions;
  }
};
