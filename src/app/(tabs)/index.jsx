import { useState, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Dimensions,
  StatusBar,
  Modal,
  Pressable,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Search,
  Grid3x3,
  List,
  Plus,
  Settings,
  SortAsc,
  BookOpen,
  Trash2,
  X,
  Check,
} from "lucide-react-native";
import useThemeStore, { THEMES, GLASS_BG } from "../../store/useThemeStore";
import useBookStore, { FILE_TYPE_TABS } from "../../store/useBookStore";
import GlassCard from "../../components/GlassCard";

const { width: SW } = Dimensions.get("window");
const IS_TABLET = SW >= 600;
const COLS = IS_TABLET ? 4 : 3;
const PAD = IS_TABLET ? 20 : 14;
const GAP = IS_TABLET ? 14 : 10;
const CARD_W = (SW - PAD * 2 - GAP * (COLS - 1)) / COLS;

// ─── Tiny progress bar ─────────────────────────────────────────────────────────
function Pbar({ p, color, bg, h = 2, style }) {
  return (
    <View
      style={[
        { height: h, borderRadius: h, backgroundColor: bg || "#E9ECEF" },
        style,
      ]}
    >
      <View
        style={{
          width: `${Math.round(p * 100)}%`,
          height: h,
          borderRadius: h,
          backgroundColor: color || "#1A1A1A",
        }}
      />
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  DEFAULT style — classic cards with shadow + gradient cover
// ══════════════════════════════════════════════════════════════════════════════
function DefaultGridCard({ book, theme, isSelected, onPress, onLongPress }) {
  const [c1, c2] = book.coverColors || ["#888", "#444"];
  const pct = Math.round(book.progress * 100);
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.86}
      style={{ width: CARD_W, marginBottom: 20 }}
    >
      <View
        style={{
          height: CARD_W * 1.45,
          borderRadius: 11,
          overflow: "hidden",
          shadowColor: c1,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.3,
          shadowRadius: 14,
          elevation: 8,
        }}
      >
        <View style={{ position: "absolute", inset: 0, backgroundColor: c1 }} />
        <View
          style={{
            position: "absolute",
            right: -CARD_W * 0.28,
            bottom: -CARD_W * 0.28,
            width: CARD_W * 0.95,
            height: CARD_W * 0.95,
            borderRadius: 999,
            backgroundColor: c2,
            opacity: 0.62,
          }}
        />
        <View
          style={{
            position: "absolute",
            left: 8,
            top: 0,
            bottom: 0,
            width: 1,
            backgroundColor: "rgba(255,255,255,0.20)",
          }}
        />
        <View style={{ position: "absolute", top: 7, left: 7, right: 7 }}>
          <View
            style={{
              alignSelf: "flex-start",
              backgroundColor: "rgba(0,0,0,0.30)",
              borderRadius: 4,
              paddingHorizontal: 4,
              paddingVertical: 2,
              marginBottom: 3,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 7.5,
                fontWeight: "800",
                letterSpacing: 0.5,
              }}
            >
              {book.format}
            </Text>
          </View>
          <Text
            style={{
              color: "rgba(255,255,255,0.80)",
              fontSize: 7.5,
              lineHeight: 11,
            }}
          >
            {book.size}
          </Text>
          {book.words !== "—" && (
            <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 7.5 }}>
              {book.words}字
            </Text>
          )}
        </View>
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.62)"]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: CARD_W * 0.7,
            justifyContent: "flex-end",
            padding: 7,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: IS_TABLET ? 12 : 10,
              fontWeight: "700",
              lineHeight: 13.5,
              textShadowColor: "rgba(0,0,0,0.6)",
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 3,
            }}
            numberOfLines={2}
          >
            {book.title}
          </Text>
        </LinearGradient>
        {isSelected && (
          <View
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.44)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: "#fff",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Check size={15} color="#1A1A1A" />
            </View>
          </View>
        )}
      </View>
      <Pbar
        p={book.progress}
        color={theme.progressFill}
        bg={theme.progressBg}
        style={{ marginTop: 7 }}
      />
      <Text
        style={{
          color: theme.text,
          fontSize: IS_TABLET ? 12 : 10.5,
          fontWeight: "500",
          marginTop: 5,
          lineHeight: 14,
        }}
        numberOfLines={1}
      >
        {book.title}
      </Text>
      <Text style={{ color: theme.textTertiary, fontSize: 9, marginTop: 1 }}>
        {pct === 0 ? "未开始" : pct >= 100 ? "已读完" : `${pct}%`}
      </Text>
    </TouchableOpacity>
  );
}

function DefaultListItem({ book, theme, isSelected, onPress, onLongPress }) {
  const [c1, c2] = book.coverColors || ["#888", "#444"];
  const pct = Math.round(book.progress * 100);
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.86}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: PAD,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        backgroundColor: isSelected ? theme.accentSoft : "transparent",
      }}
    >
      <View
        style={{
          width: 50,
          height: 72,
          borderRadius: 7,
          overflow: "hidden",
          marginRight: 14,
        }}
      >
        <View style={{ position: "absolute", inset: 0, backgroundColor: c1 }} />
        <View
          style={{
            position: "absolute",
            right: -10,
            bottom: -10,
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: c2,
            opacity: 0.6,
          }}
        />
        <View
          style={{
            position: "absolute",
            inset: 0,
            justifyContent: "flex-end",
            padding: 5,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 8.5,
              fontWeight: "700",
              lineHeight: 11,
            }}
            numberOfLines={2}
          >
            {book.title}
          </Text>
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: theme.text,
            fontSize: IS_TABLET ? 16 : 14,
            fontWeight: "600",
          }}
          numberOfLines={1}
        >
          {book.title}
        </Text>
        {book.author && (
          <Text
            style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}
            numberOfLines={1}
          >
            {book.author}
          </Text>
        )}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginTop: 6,
            flexWrap: "wrap",
          }}
        >
          <View
            style={{
              backgroundColor: theme.surfaceAlt,
              borderRadius: 4,
              paddingHorizontal: 5,
              paddingVertical: 2,
            }}
          >
            <Text
              style={{
                color: theme.textSecondary,
                fontSize: 9,
                fontWeight: "700",
              }}
            >
              {book.format}
            </Text>
          </View>
          <Text style={{ color: theme.textTertiary, fontSize: 11 }}>
            {book.size}
          </Text>
          {book.words !== "—" && (
            <Text style={{ color: theme.textTertiary, fontSize: 11 }}>
              · {book.words}字
            </Text>
          )}
          <Text style={{ color: theme.textTertiary, fontSize: 11 }}>
            · {book.lastRead}
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginTop: 8,
          }}
        >
          <Pbar
            p={book.progress}
            color={theme.progressFill}
            bg={theme.progressBg}
            style={{ flex: 1 }}
          />
          <Text
            style={{
              color: theme.textTertiary,
              fontSize: 10,
              width: 30,
              textAlign: "right",
            }}
          >
            {pct === 0 ? "未读" : pct >= 100 ? "完" : `${pct}%`}
          </Text>
        </View>
      </View>
      {isSelected && (
        <Check size={20} color={theme.accent} style={{ marginLeft: 8 }} />
      )}
    </TouchableOpacity>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  GLASS style — true iOS 26 Liquid Glass via GlassCard component
//  (BlurView + LinearGradient rim light + specular shine)
// ══════════════════════════════════════════════════════════════════════════════
function GlassGridCard({ book, gb, isSelected, onPress, onLongPress }) {
  const [c1, c2] = book.coverColors || ["#667eea", "#764ba2"];
  const pct = Math.round(book.progress * 100);
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.86}
      style={{ width: CARD_W, marginBottom: 16 }}
    >
      <GlassCard
        glassBg={gb}
        borderRadius={18}
        style={{ minHeight: CARD_W * 1.55 }}
        contentStyle={{ padding: 13 }}
      >
        {/* Book color accent bars (visible through glass) */}
        <View
          style={{ flexDirection: "row", gap: 3, marginBottom: 12, zIndex: 2 }}
        >
          <View
            style={{
              flex: 3,
              height: 3,
              borderRadius: 1.5,
              backgroundColor: c1,
              shadowColor: c1,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.8,
              shadowRadius: 4,
            }}
          />
          <View
            style={{
              flex: 1.5,
              height: 3,
              borderRadius: 1.5,
              backgroundColor: c2,
              opacity: 0.7,
            }}
          />
        </View>
        {/* Format + words chips */}
        <View
          style={{
            flexDirection: "row",
            gap: 4,
            marginBottom: 9,
            flexWrap: "wrap",
            zIndex: 2,
          }}
        >
          <View
            style={{
              paddingHorizontal: 6,
              paddingVertical: 2.5,
              borderRadius: 5,
              backgroundColor: gb.tagBg,
            }}
          >
            <Text
              style={{
                color: gb.accentColor,
                fontSize: 7.5,
                fontWeight: "800",
                letterSpacing: 0.4,
              }}
            >
              {book.format}
            </Text>
          </View>
          {book.words !== "—" && (
            <View
              style={{
                paddingHorizontal: 6,
                paddingVertical: 2.5,
                borderRadius: 5,
                backgroundColor: gb.tagBg,
              }}
            >
              <Text style={{ color: gb.textSecondary, fontSize: 7.5 }}>
                {book.words}字
              </Text>
            </View>
          )}
        </View>
        {/* Title */}
        <Text
          style={{
            color: gb.textPrimary,
            fontSize: IS_TABLET ? 13 : 11,
            fontWeight: "700",
            lineHeight: 15.5,
            marginBottom: 3,
            zIndex: 2,
          }}
          numberOfLines={3}
        >
          {book.title}
        </Text>
        {book.author && (
          <Text
            style={{
              color: gb.textMuted,
              fontSize: 9,
              marginBottom: 2,
              zIndex: 2,
            }}
            numberOfLines={1}
          >
            {book.author}
          </Text>
        )}
        <Text
          style={{
            color: gb.textMuted,
            fontSize: 8,
            marginBottom: 10,
            zIndex: 2,
          }}
        >
          {book.size}
        </Text>
        {/* Progress */}
        <View style={{ zIndex: 2 }}>
          <Pbar
            p={book.progress}
            color={gb.progressFill}
            bg={gb.progressBg}
            h={2}
          />
          <Text style={{ color: gb.textMuted, fontSize: 8, marginTop: 4 }}>
            {pct === 0 ? "未开始" : pct >= 100 ? "✓ 已读完" : `${pct}%`}
          </Text>
        </View>
      </GlassCard>
      {isSelected && (
        <View
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 18,
            backgroundColor: "rgba(0,0,0,0.40)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: "#fff",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Check size={17} color="#1A1A1A" />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

function GlassListItem({ book, gb, isSelected, onPress, onLongPress }) {
  const [c1] = book.coverColors || ["#667eea"];
  const pct = Math.round(book.progress * 100);
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.86}
      style={{ marginHorizontal: PAD, marginBottom: 10 }}
    >
      <GlassCard glassBg={gb} borderRadius={16} contentStyle={{ padding: 0 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 14,
            zIndex: 2,
          }}
        >
          {/* Glowing color circle */}
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              backgroundColor: c1,
              marginRight: 14,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: c1,
              shadowOffset: { width: 0, height: 5 },
              shadowOpacity: 0.65,
              shadowRadius: 12,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 8.5,
                fontWeight: "900",
                letterSpacing: 0.4,
              }}
            >
              {book.format}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: gb.textPrimary,
                fontSize: IS_TABLET ? 16 : 14,
                fontWeight: "700",
              }}
              numberOfLines={1}
            >
              {book.title}
            </Text>
            {book.author && (
              <Text style={{ color: gb.textMuted, fontSize: 11, marginTop: 2 }}>
                {book.author}
              </Text>
            )}
            <Text style={{ color: gb.textMuted, fontSize: 10, marginTop: 4 }}>
              {book.size}
              {book.words !== "—" ? ` · ${book.words}字` : ""} · {book.lastRead}
            </Text>
            <Pbar
              p={book.progress}
              color={gb.progressFill}
              bg={gb.progressBg}
              style={{ marginTop: 8 }}
            />
          </View>
          <Text
            style={{
              color: gb.accentColor,
              fontSize: 12,
              fontWeight: "700",
              marginLeft: 10,
            }}
          >
            {pct >= 100 ? "✓" : `${pct}%`}
          </Text>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

// ─── Sort sheet ─────────────────────────────────────────────────────────────
function SortSheet({
  visible,
  onClose,
  sortBy,
  setSortBy,
  theme,
  isGlass,
  gb,
}) {
  const options = [
    { key: "lastRead", label: "最近阅读" },
    { key: "addedAt", label: "添加时间" },
    { key: "title", label: "书名" },
    { key: "progress", label: "阅读进度" },
  ];
  const makeRow = (o, tc, ac, bc) => (
    <TouchableOpacity
      key={o.key}
      onPress={() => {
        setSortBy(o.key);
        onClose();
      }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 15,
        paddingHorizontal: 22,
        borderBottomWidth: 1,
        borderBottomColor: bc,
      }}
    >
      <Text style={{ color: tc, fontSize: 16 }}>{o.label}</Text>
      {sortBy === o.key && <Check size={18} color={ac} />}
    </TouchableOpacity>
  );
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
        onPress={onClose}
      />
      <View
        style={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          overflow: "hidden",
        }}
      >
        {isGlass ? (
          <BlurView intensity={88} tint={gb.tint}>
            <View style={{ backgroundColor: gb.sheetBg, paddingBottom: 38 }}>
              <LinearGradient
                colors={[gb.specularColor, "transparent"]}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 40,
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                }}
              />
              <View
                style={{
                  width: 36,
                  height: 4,
                  backgroundColor: gb.sheetBorder,
                  borderRadius: 2,
                  alignSelf: "center",
                  marginTop: 10,
                  marginBottom: 16,
                }}
              />
              {options.map((o) =>
                makeRow(o, gb.textPrimary, gb.accentColor, gb.sheetBorder),
              )}
            </View>
          </BlurView>
        ) : (
          <View
            style={{ backgroundColor: theme.readerMenuBg, paddingBottom: 38 }}
          >
            <View
              style={{
                width: 36,
                height: 4,
                backgroundColor: theme.border,
                borderRadius: 2,
                alignSelf: "center",
                marginTop: 10,
                marginBottom: 16,
              }}
            />
            {options.map((o) =>
              makeRow(o, theme.text, theme.accent, theme.readerMenuBorder),
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}

// ─── Main Bookshelf ────────────────────────────────────────────────────────────
export default function Bookshelf() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { uiStyle, colorScheme, themeId } = useThemeStore();
  const scheme = colorScheme || themeId || "minimal";
  const theme = THEMES[scheme] || THEMES.minimal;
  const gb = GLASS_BG[scheme] || GLASS_BG.minimal;
  const isGlass = uiStyle === "glass";

  const {
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    activeFileType,
    setActiveFileType,
    getFilteredBooks,
    isSelecting,
    startSelecting,
    endSelecting,
    selectedIds,
    toggleSelect,
    removeSelected,
  } = useBookStore();
  const storeBooks = useBookStore((s) => s.books);

  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const searchRef = useRef(null);

  const books = useMemo(
    () => getFilteredBooks(query, activeFileType),
    [query, activeFileType, sortBy, storeBooks],
  );

  const handlePress = useCallback(
    (book) => {
      if (isSelecting) {
        toggleSelect(book.id);
        return;
      }
      router.push(
        book.format === "ZIP" ? `/manga/${book.id}` : `/reader/${book.id}`,
      );
    },
    [isSelecting, toggleSelect, router],
  );

  const handleLong = useCallback(
    (book) => {
      if (!isSelecting) startSelecting();
      toggleSelect(book.id);
    },
    [isSelecting, startSelecting, toggleSelect],
  );

  const confirmDelete = useCallback(() => {
    Alert.alert("确认删除", `将从书架中移除 ${selectedIds.length} 本`, [
      { text: "取消", style: "cancel" },
      { text: "删除", style: "destructive", onPress: removeSelected },
    ]);
  }, [selectedIds.length, removeSelected]);

  const gridRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < books.length; i += COLS) {
      const row = books.slice(i, i + COLS);
      while (row.length < COLS) row.push(null);
      rows.push(row);
    }
    return rows;
  }, [books]);

  const renderGridRow = useCallback(
    ({ item }) => (
      <View style={{ flexDirection: "row", gap: GAP, paddingHorizontal: PAD }}>
        {item.map((book, idx) => {
          if (!book) return <View key={`e${idx}`} style={{ width: CARD_W }} />;
          const sel = selectedIds.includes(book.id);
          return isGlass ? (
            <GlassGridCard
              key={book.id}
              book={book}
              gb={gb}
              isSelected={sel}
              onPress={() => handlePress(book)}
              onLongPress={() => handleLong(book)}
            />
          ) : (
            <DefaultGridCard
              key={book.id}
              book={book}
              theme={theme}
              isSelected={sel}
              onPress={() => handlePress(book)}
              onLongPress={() => handleLong(book)}
            />
          );
        })}
      </View>
    ),
    [isGlass, gb, theme, selectedIds, handlePress, handleLong],
  );

  const renderListItem = useCallback(
    ({ item }) => {
      const sel = selectedIds.includes(item.id);
      return isGlass ? (
        <GlassListItem
          key={item.id}
          book={item}
          gb={gb}
          isSelected={sel}
          onPress={() => handlePress(item)}
          onLongPress={() => handleLong(item)}
        />
      ) : (
        <DefaultListItem
          key={item.id}
          book={item}
          theme={theme}
          isSelected={sel}
          onPress={() => handlePress(item)}
          onLongPress={() => handleLong(item)}
        />
      );
    },
    [isGlass, gb, theme, selectedIds, handlePress, handleLong],
  );

  // ─── Derived colors ──────────────────────────────────────────────────────────
  const iconColor = isGlass ? gb.textPrimary : theme.text;
  const headText = isGlass ? gb.textPrimary : theme.text;
  const subColor = isGlass ? gb.textMuted : theme.textSecondary;

  // ─── Header ──────────────────────────────────────────────────────────────────
  const HeaderInner = () => (
    <View style={{ paddingTop: insets.top + 4 }}>
      {showSearch ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: PAD,
            paddingBottom: 12,
            gap: 10,
          }}
        >
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              height: 40,
              paddingHorizontal: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: isGlass ? gb.rimMid : theme.border,
              backgroundColor: isGlass
                ? "rgba(255,255,255,0.08)"
                : theme.surface,
            }}
          >
            <Search
              size={15}
              color={isGlass ? gb.textMuted : theme.textTertiary}
            />
            <TextInput
              ref={searchRef}
              value={query}
              onChangeText={setQuery}
              placeholder="搜索书名、作者…"
              placeholderTextColor={isGlass ? gb.textMuted : theme.textTertiary}
              style={{ flex: 1, color: headText, fontSize: 15, marginLeft: 8 }}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery("")}>
                <X size={14} color={iconColor} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            onPress={() => {
              setShowSearch(false);
              setQuery("");
            }}
          >
            <Text
              style={{
                color: isGlass ? gb.accentColor : theme.accent,
                fontSize: 15,
                fontWeight: "600",
              }}
            >
              取消
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: PAD,
            paddingBottom: 12,
          }}
        >
          <Text
            style={{
              flex: 1,
              color: headText,
              fontSize: IS_TABLET ? 27 : 22,
              fontWeight: "800",
              letterSpacing: -0.5,
            }}
          >
            {isSelecting ? `已选 ${selectedIds.length}` : "书架"}
          </Text>
          {isSelecting ? (
            <View style={{ flexDirection: "row", gap: 16 }}>
              <TouchableOpacity onPress={confirmDelete}>
                <Trash2 size={22} color="#FF6B6B" />
              </TouchableOpacity>
              <TouchableOpacity onPress={endSelecting}>
                <X size={22} color={iconColor} />
              </TouchableOpacity>
            </View>
          ) : (
            <View
              style={{ flexDirection: "row", gap: 18, alignItems: "center" }}
            >
              <TouchableOpacity
                onPress={() => {
                  setShowSearch(true);
                  setTimeout(() => searchRef.current?.focus(), 80);
                }}
              >
                <Search size={22} color={iconColor} strokeWidth={1.8} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  setViewMode(viewMode === "grid" ? "list" : "grid")
                }
              >
                {viewMode === "grid" ? (
                  <List size={22} color={iconColor} strokeWidth={1.8} />
                ) : (
                  <Grid3x3 size={22} color={iconColor} strokeWidth={1.8} />
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/settings")}>
                <Settings size={22} color={iconColor} strokeWidth={1.8} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* File type tabs */}
      {!isSelecting && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{
            paddingHorizontal: PAD,
            gap: 8,
            paddingBottom: 10,
          }}
        >
          {FILE_TYPE_TABS.map((tab) => {
            const active = activeFileType === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveFileType(tab.key)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: isGlass
                    ? active
                      ? gb.accentColor
                      : gb.tagBorder
                    : active
                      ? theme.accent
                      : theme.border,
                  backgroundColor: isGlass
                    ? active
                      ? "rgba(255,255,255,0.12)"
                      : "rgba(255,255,255,0.04)"
                    : active
                      ? theme.accent
                      : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: active ? "700" : "400",
                    color: isGlass
                      ? active
                        ? gb.accentColor
                        : gb.textMuted
                      : active
                        ? theme.accentText
                        : theme.textSecondary,
                  }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Sub bar */}
      {!isSelecting && !showSearch && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: PAD,
            paddingBottom: 8,
          }}
        >
          <Text style={{ color: subColor, fontSize: 12 }}>
            {books.length} 本
          </Text>
          <TouchableOpacity
            onPress={() => setShowSort(true)}
            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <SortAsc size={13} color={subColor} />
            <Text style={{ color: subColor, fontSize: 12 }}>
              {
                {
                  lastRead: "最近",
                  addedAt: "添加",
                  title: "书名",
                  progress: "进度",
                }[sortBy]
              }
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const emptyView = (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        paddingTop: 40,
      }}
    >
      <BookOpen
        size={56}
        color={isGlass ? gb.textMuted : theme.textTertiary}
        strokeWidth={1.2}
      />
      <Text
        style={{
          color: isGlass ? gb.textSecondary : theme.textTertiary,
          fontSize: 16,
        }}
      >
        {query ? "没有找到相关书籍" : "书架空空如也"}
      </Text>
      {!query && (
        <TouchableOpacity
          onPress={() => router.push("/import")}
          style={{
            paddingHorizontal: 28,
            paddingVertical: 12,
            borderRadius: 28,
            backgroundColor: isGlass ? gb.tagBg : theme.accent,
            borderWidth: isGlass ? 1 : 0,
            borderColor: isGlass ? gb.accentColor : undefined,
          }}
        >
          <Text
            style={{
              color: isGlass ? gb.accentColor : theme.accentText,
              fontSize: 15,
              fontWeight: "600",
            }}
          >
            导入书籍
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const fabBottom = insets.bottom + 28;
  const listBody =
    books.length === 0 ? (
      emptyView
    ) : viewMode === "grid" ? (
      <FlatList
        data={gridRows}
        keyExtractor={(_, i) => `r${i}`}
        renderItem={renderGridRow}
        contentContainerStyle={{
          paddingTop: 14,
          paddingBottom: fabBottom + 70,
        }}
        showsVerticalScrollIndicator={false}
      />
    ) : (
      <FlatList
        data={books}
        keyExtractor={(b) => b.id}
        renderItem={renderListItem}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: fabBottom + 70 }}
        showsVerticalScrollIndicator={false}
      />
    );

  // FAB — glass version uses GlassCard-style rim + blur
  const FAB =
    !isSelecting &&
    (isGlass ? (
      <TouchableOpacity
        onPress={() => router.push("/import")}
        style={{
          position: "absolute",
          right: PAD,
          bottom: fabBottom,
          width: 58,
          height: 58,
          borderRadius: 29,
          overflow: "hidden",
          shadowColor: gb.accentColor,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.55,
          shadowRadius: 22,
          elevation: 14,
        }}
      >
        <LinearGradient
          colors={[gb.rimTop, gb.rimMid, gb.rimBottom]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.7, y: 1 }}
          style={{ position: "absolute", inset: 0, borderRadius: 29 }}
        />
        <View
          style={{ margin: 1, borderRadius: 28, overflow: "hidden", flex: 1 }}
        >
          <BlurView
            intensity={gb.blurIntensity}
            tint={gb.tint}
            style={{ flex: 1 }}
          >
            <LinearGradient
              colors={[gb.specularColor, "transparent"]}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 30,
                borderRadius: 28,
              }}
            />
            <View
              style={{
                flex: 1,
                backgroundColor: gb.fabFill,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Plus size={26} color={gb.fabIconColor} strokeWidth={2.4} />
            </View>
          </BlurView>
        </View>
      </TouchableOpacity>
    ) : (
      <TouchableOpacity
        onPress={() => router.push("/import")}
        style={{
          position: "absolute",
          right: PAD,
          bottom: fabBottom,
          width: 54,
          height: 54,
          borderRadius: 27,
          backgroundColor: theme.accent,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.22,
          shadowRadius: 16,
          elevation: 10,
        }}
      >
        <Plus size={26} color={theme.accentText} strokeWidth={2.2} />
      </TouchableOpacity>
    ));

  // ─── GLASS layout ────────────────────────────────────────────────────────────
  if (isGlass) {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar
          barStyle={gb.statusBar}
          translucent
          backgroundColor="transparent"
        />
        {/* Rich dark/saturated gradient wall behind everything */}
        <LinearGradient
          colors={gb.gradient}
          start={{ x: gb.gradientAngle.x, y: 0 }}
          end={{ x: 1 - gb.gradientAngle.x, y: 1 }}
          style={{ position: "absolute", inset: 0 }}
        />
        {/* Frosted glass header panel */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 20,
            overflow: "hidden",
          }}
        >
          {/* Rim at header bottom */}
          <LinearGradient
            colors={[gb.rimTop, gb.rimMid, gb.rimBottom]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.6, y: 1 }}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 1,
            }}
          />
          <BlurView intensity={gb.blurIntensity} tint={gb.tint}>
            <View style={{ backgroundColor: gb.headerFill }}>
              {/* Header top specular */}
              <LinearGradient
                colors={[gb.specularColor, "transparent"]}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: insets.top + 55,
                }}
              />
              <HeaderInner />
            </View>
          </BlurView>
        </View>
        <View style={{ flex: 1, marginTop: showSearch ? 124 : 154 }}>
          {listBody}
        </View>
        {FAB}
        <SortSheet
          visible={showSort}
          onClose={() => setShowSort(false)}
          sortBy={sortBy}
          setSortBy={setSortBy}
          theme={theme}
          isGlass
          gb={gb}
        />
      </View>
    );
  }

  // ─── DEFAULT layout ───────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar
        barStyle={theme.statusBar || "dark-content"}
        backgroundColor={theme.bg}
      />
      <View
        style={{
          backgroundColor: theme.bg,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        }}
      >
        <HeaderInner />
      </View>
      <View style={{ flex: 1 }}>{listBody}</View>
      {FAB}
      <SortSheet
        visible={showSort}
        onClose={() => setShowSort(false)}
        sortBy={sortBy}
        setSortBy={setSortBy}
        theme={theme}
        isGlass={false}
        gb={gb}
      />
    </View>
  );
}
