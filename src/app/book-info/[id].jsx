import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft,
  BookOpen,
  User,
  FileText,
  Hash,
  Bookmark,
  Tag,
  Trash2,
  Edit3,
  Check,
  X,
} from "lucide-react-native";
import useThemeStore, { THEMES } from "../../store/useThemeStore";
import useBookStore from "../../store/useBookStore";
import useReaderStore from "../../store/useReaderStore";

function InfoRow({ icon: Icon, label, value, theme }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        paddingVertical: 13,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
      }}
    >
      <Icon
        size={16}
        color={theme.textTertiary}
        style={{ marginTop: 2, marginRight: 12 }}
      />
      <View style={{ flex: 1 }}>
        <Text
          style={{ color: theme.textTertiary, fontSize: 11, marginBottom: 3 }}
        >
          {label}
        </Text>
        <Text style={{ color: theme.text, fontSize: 14, lineHeight: 20 }}>
          {value || "—"}
        </Text>
      </View>
    </View>
  );
}

export default function BookInfo() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { themeId, colorScheme } = useThemeStore();
  const theme = THEMES[colorScheme || themeId] || THEMES.minimal;

  const books = useBookStore((s) => s.books);
  const removeBook = useBookStore((s) => s.removeBook);
  const getBookmarks = useReaderStore((s) => s.getBookmarks);

  const book = books.find((b) => b.id === id) || books[0];
  const bookmarks = getBookmarks(book?.id);
  const [c1, c2] = book?.coverColors || ["#888", "#555"];
  const pct = Math.round((book?.progress || 0) * 100);

  const handleDelete = () => {
    Alert.alert("移出书架", `确认将《${book?.title}》从书架移除？`, [
      { text: "取消", style: "cancel" },
      {
        text: "移除",
        style: "destructive",
        onPress: () => {
          removeBook(book?.id);
          router.back();
        },
      },
    ]);
  };

  if (!book) return null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar
        barStyle={themeId === "dark" ? "light-content" : "dark-content"}
      />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 4,
          paddingBottom: 14,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
          backgroundColor: theme.bg,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ padding: 4, marginRight: 8 }}
        >
          <ChevronLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text
          style={{
            flex: 1,
            color: theme.text,
            fontSize: 17,
            fontWeight: "700",
          }}
        >
          书籍信息
        </Text>
        <TouchableOpacity onPress={handleDelete} style={{ padding: 4 }}>
          <Trash2 size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover hero */}
        <View
          style={{
            alignItems: "center",
            paddingVertical: 32,
            backgroundColor: theme.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
          }}
        >
          {/* Cover */}
          <View
            style={{
              width: 110,
              height: 156,
              borderRadius: 10,
              overflow: "hidden",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 20,
              elevation: 12,
            }}
          >
            <View
              style={{ position: "absolute", inset: 0, backgroundColor: c1 }}
            />
            <View
              style={{
                position: "absolute",
                right: -30,
                bottom: -30,
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: c2,
                opacity: 0.7,
              }}
            />
            <View
              style={{
                position: "absolute",
                left: 10,
                top: 0,
                bottom: 0,
                width: 1,
                backgroundColor: "rgba(255,255,255,0.15)",
              }}
            />
            <View
              style={{
                position: "absolute",
                inset: 0,
                padding: 12,
                justifyContent: "flex-end",
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: "700",
                  lineHeight: 18,
                  textShadowColor: "rgba(0,0,0,0.3)",
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 3,
                }}
                numberOfLines={4}
              >
                {book.title}
              </Text>
            </View>
          </View>

          <Text
            style={{
              color: theme.text,
              fontSize: 20,
              fontWeight: "700",
              marginTop: 20,
            }}
          >
            {book.title}
          </Text>
          {book.author ? (
            <Text
              style={{ color: theme.textSecondary, fontSize: 14, marginTop: 6 }}
            >
              {book.author}
            </Text>
          ) : null}

          {/* Stats row */}
          <View style={{ flexDirection: "row", gap: 32, marginTop: 20 }}>
            {[
              {
                label: "进度",
                value: pct === 0 ? "未读" : pct === 100 ? "已完成" : `${pct}%`,
              },
              { label: "书签", value: `${bookmarks.length}` },
              { label: "章节", value: `${book.totalChapters || 1}` },
            ].map((s) => (
              <View key={s.label} style={{ alignItems: "center" }}>
                <Text
                  style={{ color: theme.text, fontSize: 18, fontWeight: "700" }}
                >
                  {s.value}
                </Text>
                <Text
                  style={{
                    color: theme.textTertiary,
                    fontSize: 11,
                    marginTop: 3,
                  }}
                >
                  {s.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Progress bar */}
          <View
            style={{
              width: 200,
              height: 4,
              backgroundColor: theme.progressBg,
              borderRadius: 2,
              marginTop: 16,
            }}
          >
            <View
              style={{
                width: `${pct}%`,
                height: 4,
                backgroundColor: theme.progressFill,
                borderRadius: 2,
              }}
            />
          </View>
        </View>

        {/* Info section */}
        <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
          <Text
            style={{
              color: theme.textTertiary,
              fontSize: 11,
              fontWeight: "700",
              letterSpacing: 1,
              paddingTop: 16,
              paddingBottom: 4,
            }}
          >
            基本信息
          </Text>
          <InfoRow
            icon={FileText}
            label="格式"
            value={book.format}
            theme={theme}
          />
          <InfoRow
            icon={Hash}
            label="文件大小"
            value={book.size}
            theme={theme}
          />
          <InfoRow icon={Hash} label="字数" value={book.words} theme={theme} />
          <InfoRow icon={Tag} label="分组" value={book.group} theme={theme} />
          <InfoRow
            icon={BookOpen}
            label="最后阅读"
            value={book.lastRead}
            theme={theme}
          />
          <InfoRow
            icon={FileText}
            label="文件路径"
            value={book.path}
            theme={theme}
          />
        </View>

        {/* Description */}
        {book.description ? (
          <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
            <Text
              style={{
                color: theme.textTertiary,
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 1,
                paddingTop: 16,
                paddingBottom: 10,
              }}
            >
              简介
            </Text>
            <Text
              style={{
                color: theme.textSecondary,
                fontSize: 14,
                lineHeight: 22,
              }}
            >
              {book.description}
            </Text>
          </View>
        ) : null}

        {/* Action buttons */}
        <View style={{ paddingHorizontal: 20, marginTop: 24, gap: 12 }}>
          <TouchableOpacity
            onPress={() =>
              book?.format === "ZIP"
                ? router.push(`/manga/${book.id}`)
                : router.push(`/reader/${book.id}`)
            }
            style={{
              backgroundColor: theme.accent,
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: theme.accentText,
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              {pct === 0 ? "开始阅读" : pct === 100 ? "再读一遍" : "继续阅读"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push(`/toc/${book.id}`)}
            style={{
              backgroundColor: theme.surface,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: theme.border,
              paddingVertical: 14,
              alignItems: "center",
            }}
          >
            <Text
              style={{ color: theme.text, fontSize: 15, fontWeight: "500" }}
            >
              查看目录
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
