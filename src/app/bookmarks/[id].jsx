import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { X, Bookmark, Trash2 } from "lucide-react-native";
import useThemeStore, { THEMES } from "../../store/useThemeStore";
import useBookStore from "../../store/useBookStore";
import useReaderStore from "../../store/useReaderStore";

export default function BookmarksPage() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { themeId } = useThemeStore();
  const theme = THEMES[themeId];
  const books = useBookStore((s) => s.books);
  const { getBookmarks, removeBookmark } = useReaderStore();

  const book = books.find((b) => b.id === id) || books[0];
  const marks = getBookmarks(book?.id);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => router.push(`/reader/${book?.id}`)}
      activeOpacity={0.85}
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: theme.borderLight,
      }}
    >
      <Bookmark
        size={16}
        color={theme.accent}
        fill={theme.accent}
        style={{ marginTop: 3, marginRight: 14 }}
        strokeWidth={1.5}
      />
      <View style={{ flex: 1 }}>
        <Text
          style={{ color: theme.textTertiary, fontSize: 11, marginBottom: 6 }}
        >
          {item.chapter} · {item.time}
        </Text>
        <Text
          style={{ color: theme.text, fontSize: 14, lineHeight: 21 }}
          numberOfLines={3}
        >
          {item.text}
        </Text>
        {/* mini progress */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginTop: 8,
          }}
        >
          <View
            style={{
              flex: 1,
              height: 2,
              backgroundColor: theme.progressBg,
              borderRadius: 1,
            }}
          >
            <View
              style={{
                width: `${Math.round((item.position || 0) * 100)}%`,
                height: 2,
                backgroundColor: theme.progressFill,
                borderRadius: 1,
              }}
            />
          </View>
          <Text style={{ color: theme.textTertiary, fontSize: 10 }}>
            {Math.round((item.position || 0) * 100)}%
          </Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => removeBookmark(book?.id, item.id)}
        style={{ padding: 4, marginLeft: 8 }}
      >
        <Trash2 size={16} color={theme.textTertiary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

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
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: "700" }}>
            书签
          </Text>
          {book && (
            <Text
              style={{ color: theme.textTertiary, fontSize: 12, marginTop: 2 }}
              numberOfLines={1}
            >
              {book.title}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={22} color={theme.text} />
        </TouchableOpacity>
      </View>

      {marks.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <Bookmark size={52} color={theme.textTertiary} strokeWidth={1.2} />
          <Text style={{ color: theme.textTertiary, fontSize: 16 }}>
            还没有书签
          </Text>
          <Text
            style={{
              color: theme.textTertiary,
              fontSize: 13,
              textAlign: "center",
            }}
          >
            在阅读页点击顶栏{"\n"}书签图标添加
          </Text>
        </View>
      ) : (
        <>
          <View
            style={{
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderBottomColor: theme.borderLight,
            }}
          >
            <Text style={{ color: theme.textTertiary, fontSize: 12 }}>
              共 {marks.length} 个书签
            </Text>
          </View>
          <FlatList
            data={marks}
            keyExtractor={(m) => m.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          />
        </>
      )}
    </View>
  );
}
