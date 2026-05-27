import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Search, X, BookOpen } from "lucide-react-native";
import useThemeStore, { THEMES } from "../../store/useThemeStore";
import useBookStore from "../../store/useBookStore";

function HighlightText({ text, query, theme }) {
  if (!query)
    return <Text style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 19 }}>{text}</Text>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1)
    return <Text style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 19 }}>{text}</Text>;
  return (
    <Text style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 19 }}>
      {text.slice(0, idx)}
      <Text style={{ color: theme.accent, fontWeight: "700", backgroundColor: theme.accentSoft }}>
        {text.slice(idx, idx + query.length)}
      </Text>
      {text.slice(idx + query.length)}
    </Text>
  );
}

export default function SearchPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { themeId } = useThemeStore();
  const theme = THEMES[themeId] || THEMES.minimal;
  const books = useBookStore((s) => s.books);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef(null);

  const doSearch = (q) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    const lq = q.toLowerCase();
    const all = [];
    books.forEach((book) => {
      // Search in title and author
      if (book.title.toLowerCase().includes(lq) || (book.author || "").toLowerCase().includes(lq)) {
        all.push({ id: `title-${book.id}`, book, chapter: { title: book.title }, text: book.title, matchIndex: 0 });
      }
      // Search in parsed chapters (titles only, since we don't have full content loaded)
      const chapters = book._parsed?.chapters || [];
      chapters.forEach((ch) => {
        if (ch.title.toLowerCase().includes(lq)) {
          all.push({
            id: `${book.id}-${ch.title}`,
            book,
            chapter: ch,
            text: `章节: ${ch.title}`,
            matchIndex: 3,
          });
        }
      });
    });
    setResults(all.slice(0, 30));
    setSearched(true);
  };

  const handleChange = (text) => {
    setQuery(text);
    if (text.length >= 2) doSearch(text);
    else { setResults([]); setSearched(false); }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => router.push(`/reader/${item.book.id}`)}
      activeOpacity={0.8}
      style={{ paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: theme.borderLight }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <BookOpen size={12} color={theme.textTertiary} />
        <Text style={{ color: theme.textTertiary, fontSize: 11 }}>
          {item.book.title} · {item.chapter.title}
        </Text>
      </View>
      <HighlightText text={item.text} query={query} theme={theme} />
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={themeId === "dark" ? "light-content" : "dark-content"} />
      <View
        style={{
          paddingTop: insets.top + 8, paddingBottom: 12, paddingHorizontal: 16,
          flexDirection: "row", alignItems: "center", gap: 12,
          borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.bg,
        }}
      >
        <View
          style={{
            flex: 1, flexDirection: "row", alignItems: "center",
            backgroundColor: theme.surface, borderRadius: 12, borderWidth: 1,
            borderColor: theme.border, paddingHorizontal: 12, height: 42,
          }}
        >
          <Search size={16} color={theme.textTertiary} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={handleChange}
            placeholder="搜索书名和章节…"
            placeholderTextColor={theme.textTertiary}
            autoFocus
            style={{ flex: 1, color: theme.text, fontSize: 15, marginLeft: 8 }}
            returnKeyType="search"
            onSubmitEditing={() => doSearch(query)}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(""); setResults([]); setSearched(false); }}>
              <X size={15} color={theme.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: theme.accent, fontSize: 15, fontWeight: "500" }}>取消</Text>
        </TouchableOpacity>
      </View>

      {searched && results.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
          <Search size={48} color={theme.textTertiary} strokeWidth={1.5} />
          <Text style={{ color: theme.textTertiary, fontSize: 16 }}>没有找到相关内容</Text>
        </View>
      ) : results.length > 0 ? (
        <>
          <View style={{ paddingHorizontal: 20, paddingVertical: 10 }}>
            <Text style={{ color: theme.textTertiary, fontSize: 12 }}>找到 {results.length} 处结果</Text>
          </View>
          <FlatList
            data={results}
            keyExtractor={(r) => r.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          />
        </>
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12, opacity: 0.5 }}>
          <Search size={52} color={theme.textTertiary} strokeWidth={1.2} />
          <Text style={{ color: theme.textTertiary, fontSize: 15 }}>搜索书架内容</Text>
          <Text style={{ color: theme.textTertiary, fontSize: 13 }}>输入 2 个字以上开始搜索</Text>
        </View>
      )}
    </View>
  );
}
