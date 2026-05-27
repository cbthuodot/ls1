import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { X, RotateCcw, ChevronRight } from "lucide-react-native";
import useThemeStore, { THEMES } from "../../store/useThemeStore";
import useBookStore from "../../store/useBookStore";

export default function TocPage() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { themeId } = useThemeStore();
  const theme = THEMES[themeId] || THEMES.minimal;
  const books = useBookStore((s) => s.books);
  const book = books.find((b) => b.id === id) || books[0];
  const parsedChapters = book?._parsed?.chapters || [];

  const [reversed, setReversed] = useState(false);
  const currentChIdx = book?.currentChapter || 0;
  const chapters = reversed ? [...parsedChapters].reverse() : parsedChapters;

  const renderItem = ({ item, index }) => {
    const realIdx = reversed ? parsedChapters.length - 1 - index : index;
    const active = realIdx === currentChIdx;
    return (
      <TouchableOpacity
        onPress={() => {
          router.back();
          setTimeout(() => router.push(`/reader/${book?.id}`), 100);
        }}
        activeOpacity={0.8}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 16,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: theme.borderLight,
          backgroundColor: active ? theme.accentSoft : "transparent",
        }}
      >
        <View
          style={{
            width: 3,
            height: 20,
            borderRadius: 2,
            backgroundColor: active ? theme.accent : "transparent",
            marginRight: 14,
          }}
        />
        <Text
          style={{
            flex: 1,
            color: active ? theme.accent : theme.text,
            fontSize: 15,
            fontWeight: active ? "600" : "400",
          }}
        >
          {item.title}
        </Text>
        {active && (
          <View
            style={{
              backgroundColor: theme.accent,
              borderRadius: 12,
              paddingHorizontal: 8,
              paddingVertical: 3,
              marginRight: 8,
            }}
          >
            <Text style={{ color: theme.accentText, fontSize: 10, fontWeight: "600" }}>
              读到这里
            </Text>
          </View>
        )}
        <ChevronRight size={16} color={theme.textTertiary} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={themeId === "dark" ? "light-content" : "dark-content"} />

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
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: "700" }}>目录</Text>
          <Text style={{ color: theme.textTertiary, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
            {book?.title}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setReversed(!reversed)}
          style={{ flexDirection: "row", alignItems: "center", gap: 5, marginRight: 16 }}
        >
          <RotateCcw size={14} color={theme.textSecondary} />
          <Text style={{ color: theme.textSecondary, fontSize: 13 }}>反转</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={22} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: theme.borderLight,
        }}
      >
        <Text style={{ color: theme.textTertiary, fontSize: 12 }}>
          共 {parsedChapters.length} 章 · 当前第 {currentChIdx + 1} 章
        </Text>
      </View>

      {parsedChapters.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: theme.textTertiary, fontSize: 15 }}>暂无章节信息</Text>
        </View>
      ) : (
        <FlatList
          data={chapters}
          keyExtractor={(ch, i) => `${ch.title}-${i}`}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          getItemLayout={(_, index) => ({ length: 56, offset: 56 * index, index })}
        />
      )}
    </View>
  );
}
