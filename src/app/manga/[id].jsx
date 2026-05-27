/**
 * ZIP / CBZ Manga Reader
 *
 * Production note: extracting pages from a ZIP file requires either:
 *   1. A native module (e.g., react-native-zip-archive or expo-modules with libzip)
 *   2. A server-side extraction step
 * In this preview, pages are simulated with colored placeholder views.
 * Replace `MOCK_PAGES` with real image URIs from your ZIP extractor.
 */
import { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  Modal,
  Pressable,
  Switch,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft,
  X,
  Settings2,
  RotateCcw,
  AlignJustify,
  Maximize2,
} from "lucide-react-native";
import useThemeStore, { THEMES } from "../../store/useThemeStore";
import useBookStore from "../../store/useBookStore";

const { width: SW, height: SH } = Dimensions.get("window");
const IS_TABLET = SW >= 600;

// Generate mock manga pages (replace with real image URIs in production)
function generateMockPages(bookId, total = 30) {
  const palettes = {
    m1: [
      ["#1a1a2e", "#16213e", "#0f3460"],
      ["#533483", "#e94560", "#1a1a2e"],
    ],
    m2: [
      ["#2d1b69", "#11998e", "#38ef7d"],
      ["#0d0d0d", "#434343", "#1a1a2e"],
    ],
    m3: [
      ["#fc4a1a", "#f7b733", "#fc4a1a"],
      ["#1c1c1c", "#3a3a3a", "#1c1c1c"],
    ],
  };
  const pal = palettes[bookId] || palettes["m1"];
  return Array.from({ length: total }, (_, i) => ({
    id: `page-${i + 1}`,
    number: i + 1,
    // In real implementation: uri from ZIP extraction
    uri: null,
    // Mock colors for display
    colors: pal[i % pal.length],
  }));
}

// ─── Mock page renderer ───────────────────────────────────────────────────────
function MangaPage({ page, width, height, isDoublePage, rightPage }) {
  const [c1, c2, c3] = page.colors || ["#1a1a2e", "#16213e", "#0f3460"];
  return (
    <View style={{ width, height, backgroundColor: c1, overflow: "hidden" }}>
      {/* Background panels (simulating manga artwork) */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: height * 0.55,
          backgroundColor: c2,
        }}
      />
      {/* Diagonal split */}
      <View
        style={{
          position: "absolute",
          top: height * 0.3,
          left: -20,
          right: -20,
          height: height * 0.08,
          backgroundColor: c1,
          transform: [{ rotate: "-3deg" }],
        }}
      />
      {/* Speed lines */}
      {Array.from({ length: 8 }).map((_, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left: i * (width / 8),
            top: 0,
            width: 1,
            height,
            backgroundColor: "rgba(255,255,255,0.04)",
          }}
        />
      ))}
      {/* Panel border */}
      <View
        style={{
          position: "absolute",
          inset: 2,
          borderWidth: 2,
          borderColor: "rgba(0,0,0,0.6)",
        }}
      />
      {/* Inner panel */}
      <View
        style={{
          position: "absolute",
          top: height * 0.08,
          left: 12,
          right: 12,
          height: height * 0.4,
          backgroundColor: c3,
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.5)",
        }}
      />
      {/* Bottom action panel */}
      <View
        style={{
          position: "absolute",
          bottom: height * 0.18,
          left: 12,
          right: 12,
          height: height * 0.18,
          backgroundColor: c2,
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.5)",
        }}
      />
      {/* Page number */}
      <View style={{ position: "absolute", bottom: 8, right: 12 }}>
        <Text
          style={{
            color: "rgba(255,255,255,0.6)",
            fontSize: 11,
            fontWeight: "700",
          }}
        >
          {page.number}
        </Text>
      </View>
      {/* ZIP badge (shows this is a simulated page) */}
      <View
        style={{
          position: "absolute",
          top: 8,
          left: 12,
          backgroundColor: "rgba(0,0,0,0.5)",
          borderRadius: 4,
          paddingHorizontal: 6,
          paddingVertical: 2,
        }}
      >
        <Text
          style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: 8,
            fontWeight: "700",
          }}
        >
          ZIP
        </Text>
      </View>
    </View>
  );
}

// ─── Settings sheet ───────────────────────────────────────────────────────────
function MangaSettingsSheet({
  visible,
  onClose,
  theme,
  direction,
  setDirection,
  doublePage,
  setDoublePage,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={{ flex: 1 }} onPress={onClose} />
      <View
        style={{
          backgroundColor: theme.readerMenuBg,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: 24,
          paddingBottom: 40,
          borderTopWidth: 1,
          borderTopColor: theme.readerMenuBorder,
        }}
      >
        <View
          style={{
            width: 36,
            height: 4,
            backgroundColor: theme.border,
            borderRadius: 2,
            alignSelf: "center",
            marginBottom: 20,
          }}
        />
        <Text
          style={{
            color: theme.text,
            fontSize: 17,
            fontWeight: "700",
            marginBottom: 20,
          }}
        >
          漫画设置
        </Text>

        {/* Reading direction */}
        <Text
          style={{
            color: theme.textTertiary,
            fontSize: 11,
            fontWeight: "700",
            letterSpacing: 1,
            marginBottom: 12,
          }}
        >
          阅读方向
        </Text>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
          {[
            { key: "rtl", label: "← 日漫（从右）", icon: "←" },
            { key: "ltr", label: "→ 美漫（从左）", icon: "→" },
          ].map((d) => (
            <TouchableOpacity
              key={d.key}
              onPress={() => setDirection(d.key)}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                borderWidth: 2,
                backgroundColor:
                  direction === d.key ? theme.accent : "transparent",
                borderColor: direction === d.key ? theme.accent : theme.border,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 20, marginBottom: 4 }}>{d.icon}</Text>
              <Text
                style={{
                  color:
                    direction === d.key
                      ? theme.accentText
                      : theme.textSecondary,
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Double page */}
        {IS_TABLET && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 14,
              borderTopWidth: 1,
              borderTopColor: theme.border,
            }}
          >
            <View>
              <Text style={{ color: theme.text, fontSize: 15 }}>双页模式</Text>
              <Text
                style={{
                  color: theme.textTertiary,
                  fontSize: 12,
                  marginTop: 2,
                }}
              >
                平板横屏适合双页
              </Text>
            </View>
            <Switch
              value={doublePage}
              onValueChange={setDoublePage}
              trackColor={{ false: theme.switchBg, true: theme.switchActive }}
              thumbColor="#fff"
            />
          </View>
        )}
      </View>
    </Modal>
  );
}

// ─── Main manga reader ────────────────────────────────────────────────────────
export default function MangaReader() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { themeId, colorScheme } = useThemeStore();
  const scheme = colorScheme || themeId || "minimal";
  const theme = THEMES[scheme] || THEMES.minimal;

  const books = useBookStore((s) => s.books);
  const updateProgress = useBookStore((s) => s.updateProgress);
  const book = books.find((b) => b.id === id) || books.find((b) => b.isManga);

  const totalPages = book?.totalPages || 30;
  const pages = generateMockPages(id, totalPages);

  const [currentPage, setCurrentPage] = useState(book?.currentPage || 0);
  const [menuVisible, setMenuVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [direction, setDirection] = useState("rtl"); // 'rtl' | 'ltr' — Japanese vs Western
  const [doublePage, setDoublePage] = useState(false);

  const menuOpacity = useRef(new Animated.Value(0)).current;
  const listRef = useRef(null);
  const pageWidth = doublePage && IS_TABLET ? SW / 2 : SW;

  const toggleMenu = useCallback(() => {
    const next = !menuVisible;
    setMenuVisible(next);
    Animated.timing(menuOpacity, {
      toValue: next ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [menuVisible, menuOpacity]);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const idx = viewableItems[0].index;
      setCurrentPage(idx);
      const prog = idx / (totalPages - 1);
      updateProgress(book?.id, Math.max(0, Math.min(1, prog)));
    }
  }).current;

  const goToPage = useCallback(
    (idx) => {
      listRef.current?.scrollToIndex({
        index: Math.max(0, Math.min(totalPages - 1, idx)),
        animated: false,
      });
    },
    [totalPages],
  );

  const displayedPages = direction === "rtl" ? [...pages].reverse() : pages;
  const displayedCurrent =
    direction === "rtl" ? totalPages - 1 - currentPage : currentPage;

  const renderPage = useCallback(
    ({ item, index }) => (
      <TouchableOpacity
        activeOpacity={1}
        onPress={toggleMenu}
        style={{ width: SW }}
      >
        {/* Tap zones: left 30% = prev, right 30% = next, center = menu */}
        <View style={{ position: "absolute", inset: 0, flexDirection: "row" }}>
          <TouchableOpacity
            style={{ flex: 3, height: "100%" }}
            onPress={() =>
              direction === "rtl" ? goToPage(index - 1) : goToPage(index + 1)
            }
          />
          <TouchableOpacity
            style={{ flex: 4, height: "100%" }}
            onPress={toggleMenu}
          />
          <TouchableOpacity
            style={{ flex: 3, height: "100%" }}
            onPress={() =>
              direction === "rtl" ? goToPage(index + 1) : goToPage(index - 1)
            }
          />
        </View>
        <MangaPage page={item} width={SW} height={SH} />
      </TouchableOpacity>
    ),
    [toggleMenu, goToPage, direction],
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar hidden />

      {/* Pages — horizontal FlatList */}
      <FlatList
        ref={listRef}
        data={displayedPages}
        keyExtractor={(p) => p.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={0}
        getItemLayout={(_, index) => ({
          length: SW,
          offset: SW * index,
          index,
        })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        renderItem={renderPage}
        // Invert for RTL (right-to-left manga reading)
        style={
          direction === "rtl" ? { transform: [{ scaleX: -1 }] } : undefined
        }
      />

      {/* Menu overlay */}
      {menuVisible && (
        <Animated.View
          style={{ position: "absolute", inset: 0, opacity: menuOpacity }}
          pointerEvents="box-none"
        >
          {/* Top bar */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              backgroundColor: "rgba(0,0,0,0.88)",
              paddingTop: (insets.top || 0) + 8,
              paddingBottom: 14,
              paddingHorizontal: 16,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ padding: 4, marginRight: 8 }}
            >
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <Text
              style={{
                flex: 1,
                color: "#fff",
                fontSize: 16,
                fontWeight: "600",
              }}
              numberOfLines={1}
            >
              {book?.title}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowSettings(true);
                setMenuVisible(false);
              }}
              style={{ padding: 4 }}
            >
              <Settings2 size={22} color="#fff" strokeWidth={1.8} />
            </TouchableOpacity>
          </View>

          {/* Bottom bar */}
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: "rgba(0,0,0,0.88)",
              paddingTop: 14,
              paddingBottom: (insets.bottom || 0) + 16,
              paddingHorizontal: 20,
            }}
          >
            {/* Page slider */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>
                1
              </Text>
              <TouchableOpacity
                activeOpacity={1}
                style={{ flex: 1, height: 24, justifyContent: "center" }}
                onPress={(e) => {
                  const { locationX, target } = e.nativeEvent;
                  // rough seek
                  const barW = SW - 40 - 60;
                  const ratio = Math.max(0, Math.min(1, locationX / barW));
                  goToPage(Math.round(ratio * (totalPages - 1)));
                }}
              >
                <View
                  style={{
                    height: 3,
                    backgroundColor: "rgba(255,255,255,0.25)",
                    borderRadius: 2,
                  }}
                >
                  <View
                    style={{
                      width: `${(displayedCurrent / (totalPages - 1)) * 100}%`,
                      height: 3,
                      backgroundColor: "#fff",
                      borderRadius: 2,
                    }}
                  />
                </View>
                <View
                  style={{
                    position: "absolute",
                    left: `${(displayedCurrent / (totalPages - 1)) * 100}%`,
                    marginLeft: -7,
                    top: 5,
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    backgroundColor: "#fff",
                  }}
                />
              </TouchableOpacity>
              <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>
                {totalPages}
              </Text>
            </View>

            {/* Page info + controls */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <TouchableOpacity
                onPress={() =>
                  goToPage(
                    direction === "rtl" ? currentPage + 1 : currentPage - 1,
                  )
                }
                style={{
                  backgroundColor: "rgba(255,255,255,0.12)",
                  borderRadius: 10,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                }}
              >
                <Text style={{ color: "#fff", fontSize: 14 }}>上一页</Text>
              </TouchableOpacity>
              <View style={{ alignItems: "center" }}>
                <Text
                  style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}
                >
                  {displayedCurrent + 1}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>
                  / {totalPages}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  goToPage(
                    direction === "rtl" ? currentPage - 1 : currentPage + 1,
                  )
                }
                style={{
                  backgroundColor: "rgba(255,255,255,0.12)",
                  borderRadius: 10,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                }}
              >
                <Text style={{ color: "#fff", fontSize: 14 }}>下一页</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}

      <MangaSettingsSheet
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        theme={theme}
        direction={direction}
        setDirection={setDirection}
        doublePage={doublePage}
        setDoublePage={setDoublePage}
      />
    </View>
  );
}
