import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { Platform } from "react-native";

export const FileHelper = {
  /**
   * Save content to a file and share it (Native) or download it (Web).
   */
  saveAndShareFile: async (
    content: string,
    filename: string,
    mimeType: string,
    uti?: string
  ) => {
    // Web platform support
    if (Platform.OS === 'web') {
      const bom = mimeType.includes('csv') ? "\ufeff" : "";
      const blob = new Blob([bom + content], { type: `${mimeType};charset=utf-8;` });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // Native platform support
    const dir = (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory;
    if (!dir) throw new Error("저장 경로를 찾을 수 없습니다.");
    
    const fileUri = dir.endsWith("/") ? `${dir}${filename}` : `${dir}/${filename}`;

    try {
      // Add BOM for CSV if needed (Excel compatibility)
      const finalContent = mimeType.includes('csv') ? "\ufeff" + content : content;

      await FileSystem.writeAsStringAsync(fileUri, finalContent, {
        encoding: (FileSystem as any).EncodingType?.UTF8 || "utf8",
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType,
          dialogTitle: `${filename} 공유`,
          UTI: uti,
        });
        return true;
      } else {
        throw new Error("공유 기능을 사용할 수 없는 기기입니다.");
      }
    } catch (error) {
      console.error("File save/share failed:", error);
      throw error;
    }
  },

  /**
   * Pick a file from the system and read its contents as a string.
   */
  pickAndReadFile: async (mimeTypes: string | string[]) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: mimeTypes,
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const fileUri = result.assets[0].uri;
      return await FileSystem.readAsStringAsync(fileUri);
    } catch (error) {
      console.error("Picking/Reading file failed:", error);
      throw error;
    }
  }
};
