import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import {
  X,
  FilePlus,
  FileText,
  ChevronRight,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react-native";
import useThemeStore, { THEMES } from "../../store/useThemeStore";
import useBookStore from "../../store/useBookStore";

function FileIcon({ format, theme }) {
  const colors = { TXT: "#6366F1", EPUB: "#10B981", PDF: "#F59E0B" };
  const color = colors[format] || theme.textSecondary;
  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: color + "20",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <FileText size={22} color={color} strokeWidth={1.8} />
    </View>
  );
}

export default function ImportPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { themeId } = useThemeStore();
  const theme = THEMES[themeId] || THEMES.minimal;
  const importBook = useBookStore((s) => s.importBook);

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const handlePickFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "text/plain",
          "application/epub+zip",
          "application/pdf",
          "application/zip",
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      setImporting(true);
      let success = 0;
      let failed = 0;

      for (const asset of result.assets) {
        try {
          const uri = asset.uri;
          const name = asset.name || "";
          await importBook(uri, name);
          success++;
        } catch (e) {
          console.error("Import error:", e);
          failed++;
        }
      }

      setImporting(false);
      setImportResult({ success, failed });

      if (success > 0) {
        setTimeout(() => router.back(), 1500);
      }
    } catch (e) {
      setImporting(false);
      Alert.alert("导入失败", e.message || "未知错误");
    }
  }, [importBook, router]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar
        barStyle={themeId === "dark" ? "light-content" : "dark-content"}
      />

      <View
        style={{
          paddingTop: insets.top + 4,
          paddingBottom: 14,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
          backgroundColor: theme.bg,
        }}
      >
        <Text
          style={{
            flex: 1,
            color: theme.text,
            fontSize: 18,
            fontWeight: "700",
          }}
        >
          {importing ? "正在导入..." : "导入书籍"}
        </Text>
        <TouchableOpacity onPress={() => router.back()} disabled={importing}>
          <X size={22} color={theme.text} />
        </TouchableOpacity>
      </View>

      {importing ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16 }}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={{ color: theme.textSecondary, fontSize: 15 }}>
            正在解析书籍...
          </Text>
        </View>
      ) : importResult ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 20 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: "#10B98120",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Check size={36} color="#10B981" strokeWidth={2.5} />
          </View>
          <Text style={{ color: theme.text, fontSize: 20, fontWeight: "700" }}>
            导入完成
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 15, textAlign: "center" }}>
            成功导入 {importResult.success} 本书
            {importResult.failed > 0 ? `，${importResult.failed} 本失败` : ""}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View
            style={{
              backgroundColor: theme.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: theme.border,
              padding: 16,
              marginBottom: 24,
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <AlertCircle size={18} color={theme.textSecondary} style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontSize: 14, fontWeight: "600", marginBottom: 4 }}>
                支持格式
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 20 }}>
                TXT · EPUB{"\n"}选择文件后自动解析并加入书架
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handlePickFile}
            activeOpacity={0.85}
            style={{
              backgroundColor: theme.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: theme.border,
              padding: 20,
              marginBottom: 14,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                backgroundColor: "#10B98118",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 16,
              }}
            >
              <FilePlus size={26} color="#10B981" strokeWidth={1.6} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: "600", marginBottom: 4 }}>
                选择本地文件
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                从文件管理器选取 TXT/EPUB 文件
              </Text>
            </View>
            <ChevronRight size={20} color={theme.textTertiary} />
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}
