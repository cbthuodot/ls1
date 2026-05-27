import { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  Modal,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft,
  List,
  Bookmark,
  Search,
  Settings2,
  Minus,
  Plus,
  X,
  ChevronRight,
  RotateCcw,
  Info,
  Type,
} from "lucide-react-native";
import useThemeStore, { THEMES } from "../../store/useThemeStore";
import useBookStore from "../../store/useBookStore";
import useReaderStore from "../../store/useReaderStore";

const { width: SW, height: SH } = Dimensions.get("window");
const IS_TABLET = SW >= 600;

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

// ─── Bottom Panel ─────────────────────────────────────────────────────────────
function BottomPanel({ visible, onClose, title, theme, children, height }) {
  const h = height || SH * 0.62;
  const slideY = useRef(new Animated.Value(h)).current;

  useEffect(() => {
    Animated.spring(slideY, {
      toValue: visible ? 0 : h,
      damping: 26,
      stiffness: 240,
      mass: 0.7,
      useNativeDriver: true,
    }).start();
  }, [visible, h]);

  if (!visible) return null;
  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.32)" }}
        onPress={onClose}
      />
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: h,
          backgroundColor: theme.readerMenuBg,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          transform: [{ translateY: slideY }],
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.12,
          shadowRadius: 24,
        }}
      >
        <View
          style={{
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: theme.readerMenuBorder,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              flex: 1,
              color: theme.text,
              fontSize: 17,
              fontWeight: "700",
            }}
          >
            {title}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <X size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
        <ScrollView
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

// ─── Stepper ─────────────────────────────────────────────────────────────────
function Stepper({ value, label, onDec, onInc, theme }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <TouchableOpacity
        onPress={onDec}
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: theme.readerMenuBorder,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Minus size={14} color={theme.text} />
      </TouchableOpacity>
      <Text
        style={{
          color: theme.text,
          fontSize: 15,
          fontWeight: "600",
          width: 44,
          textAlign: "center",
        }}
      >
        {label !== undefined ? label : value}
      </Text>
      <TouchableOpacity
        onPress={onInc}
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: theme.readerMenuBorder,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Plus size={14} color={theme.text} />
      </TouchableOpacity>
    </View>
  );
}

function SettingRow({ label, theme, children, noBorder }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 13,
        borderBottomWidth: noBorder ? 0 : 1,
        borderBottomColor: theme.readerMenuBorder,
      }}
    >
      <Text style={{ color: theme.textSecondary, fontSize: 14 }}>{label}</Text>
      {children}
    </View>
  );
}

function SectionLabel({ label, theme }) {
  return (
    <Text
      style={{
        color: theme.textTertiary,
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 1,
        marginTop: 20,
        marginBottom: 8,
      }}
    >
      {label}
    </Text>
  );
}

// ─── Built-in font options ──────────────────────────────────────────────────
const BUILTIN_FONTS = [
  {
    key: "System",
    label: "系统默认 (SF Pro / Roboto)",
    sample: "春眠不觉晓",
    fontFamily: undefined,
  },
  {
    key: "NewYork",
    label: "New York",
    sample: "春眠不觉晓",
    fontFamily: Platform.OS === "ios" ? "New York" : "serif",
  },
  {
    key: "Georgia",
    label: "Georgia",
    sample: "In the beginning",
    fontFamily: "Georgia",
  },
  {
    key: "Palatino",
    label: "Palatino",
    sample: "Once upon a time",
    fontFamily: Platform.OS === "ios" ? "Palatino" : "serif",
  },
  {
    key: "HelveticaNeue",
    label: "Helvetica Neue",
    sample: "Clean sans-serif",
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
  },
  { key: "serif", label: "衬线体", sample: "春眠不觉晓", fontFamily: "serif" },
  {
    key: "monospace",
    label: "等宽体",
    sample: "Hello 01234 AaBb",
    fontFamily: "monospace",
  },
];

// ─── Style Panel ─────────────────────────────────────────────────────────────
function StylePanel({ visible, onClose, theme, themeId, setTheme }) {
  const {
    fontSize,
    setFontSize,
    lineHeight,
    setLineHeight,
    letterSpacing,
    setLetterSpacing,
    paragraphSpacing,
    setParagraphSpacing,
    fontWeight,
    setFontWeight,
    fontFamily,
    setFontFamily,
    readMode,
    setReadMode,
    marginH,
    setMarginH,
    marginTop,
    setMarginTop,
    marginBottom,
    setMarginBottom,
    customFonts,
  } = useReaderStore();

  const allFonts = [
    ...BUILTIN_FONTS,
    ...(customFonts || []).map((f) => ({
      key: f.name,
      label: `${f.name} ★`,
      sample: "春眠不觉晓",
      fontFamily: f.name,
    })),
  ];

  const themeOptions = [
    {
      id: "minimal",
      label: "极简留白",
      bg: "#FFFFFF",
      border: "#E9ECEF",
      text: "#1A1A1A",
    },
    {
      id: "paper",
      label: "纸感阅读",
      bg: "#F4ECD8",
      border: "#C8B89A",
      text: "#3B2A1A",
    },
    {
      id: "dark",
      label: "深色专注",
      bg: "#121212",
      border: "#2C2C2C",
      text: "#D0D0D0",
    },
  ];
  const modeOptions = [
    { key: "scroll", label: "滚动" },
    { key: "page", label: "翻页" },
    { key: "noAnim", label: "无动画" },
  ];
  const weightOptions = [
    { key: "300", label: "细" },
    { key: "400", label: "常" },
    { key: "500", label: "中" },
    { key: "600", label: "粗" },
  ];

  return (
    <BottomPanel
      visible={visible}
      onClose={onClose}
      title="阅读样式"
      theme={theme}
      height={SH * 0.88}
    >
      {/* Color theme */}
      <SectionLabel label="主色调" theme={theme} />
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 4 }}>
        {themeOptions.map((t) => (
          <TouchableOpacity
            key={t.id}
            onPress={() => setTheme(t.id)}
            style={{
              flex: 1,
              height: 56,
              borderRadius: 12,
              borderWidth: 2.5,
              backgroundColor: t.bg,
              borderColor:
                themeId === t.id
                  ? t.id === "dark"
                    ? "#D4D4D4"
                    : "#1A1A1A"
                  : t.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 10, color: t.text, fontWeight: "600" }}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Read mode */}
      <SectionLabel label="翻页方式" theme={theme} />
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 4 }}>
        {modeOptions.map((m) => (
          <TouchableOpacity
            key={m.key}
            onPress={() => setReadMode(m.key)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 10,
              borderWidth: 1,
              backgroundColor:
                readMode === m.key ? theme.accent : "transparent",
              borderColor:
                readMode === m.key ? theme.accent : theme.readerMenuBorder,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color:
                  readMode === m.key ? theme.accentText : theme.textSecondary,
                fontSize: 13,
                fontWeight: "500",
              }}
            >
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Typography */}
      <SectionLabel label="排版" theme={theme} />
      <SettingRow label="字号" theme={theme}>
        <Stepper
          value={fontSize}
          label={`${fontSize}`}
          onDec={() => setFontSize(fontSize - 1)}
          onInc={() => setFontSize(fontSize + 1)}
          theme={theme}
        />
      </SettingRow>
      <SettingRow label="行间距" theme={theme}>
        <Stepper
          value={lineHeight}
          label={lineHeight.toFixed(1)}
          onDec={() => setLineHeight(+(lineHeight - 0.1).toFixed(1))}
          onInc={() => setLineHeight(+(lineHeight + 0.1).toFixed(1))}
          theme={theme}
        />
      </SettingRow>
      <SettingRow label="字间距" theme={theme}>
        <Stepper
          value={letterSpacing}
          label={`${+letterSpacing.toFixed(1)}`}
          onDec={() => setLetterSpacing(+(letterSpacing - 0.1).toFixed(1))}
          onInc={() => setLetterSpacing(+(letterSpacing + 0.1).toFixed(1))}
          theme={theme}
        />
      </SettingRow>
      <SettingRow label="段间距" theme={theme}>
        <Stepper
          value={paragraphSpacing}
          label={`${paragraphSpacing}`}
          onDec={() => setParagraphSpacing(paragraphSpacing - 2)}
          onInc={() => setParagraphSpacing(paragraphSpacing + 2)}
          theme={theme}
        />
      </SettingRow>
      <SettingRow label="字重" theme={theme} noBorder>
        <View style={{ flexDirection: "row", gap: 6 }}>
          {weightOptions.map((w) => (
            <TouchableOpacity
              key={w.key}
              onPress={() => setFontWeight(w.key)}
              style={{
                width: 38,
                height: 34,
                borderRadius: 8,
                borderWidth: 1,
                backgroundColor:
                  fontWeight === w.key ? theme.accent : "transparent",
                borderColor:
                  fontWeight === w.key ? theme.accent : theme.readerMenuBorder,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color:
                    fontWeight === w.key
                      ? theme.accentText
                      : theme.textSecondary,
                  fontSize: 13,
                  fontWeight: w.key,
                }}
              >
                {w.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SettingRow>

      {/* Margins */}
      <SectionLabel label="页面边距" theme={theme} />
      <SettingRow label="左右边距" theme={theme}>
        <Stepper
          value={marginH}
          label={`${marginH}`}
          onDec={() => setMarginH(marginH - 4)}
          onInc={() => setMarginH(marginH + 4)}
          theme={theme}
        />
      </SettingRow>
      <SettingRow label="上边距" theme={theme}>
        <Stepper
          value={marginTop}
          label={`${marginTop}`}
          onDec={() => setMarginTop(marginTop - 4)}
          onInc={() => setMarginTop(marginTop + 4)}
          theme={theme}
        />
      </SettingRow>
      <SettingRow label="下边距" theme={theme} noBorder>
        <Stepper
          value={marginBottom}
          label={`${marginBottom}`}
          onDec={() => setMarginBottom(marginBottom - 4)}
          onInc={() => setMarginBottom(marginBottom + 4)}
          theme={theme}
        />
      </SettingRow>

      {/* Font selection */}
      <SectionLabel label="字体选择" theme={theme} />
      <View style={{ gap: 6 }}>
        {allFonts.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFontFamily(f.key)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
              paddingHorizontal: 14,
              borderRadius: 10,
              borderWidth: 1,
              backgroundColor:
                fontFamily === f.key ? theme.accentSoft : "transparent",
              borderColor:
                fontFamily === f.key ? theme.accent : theme.readerMenuBorder,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: theme.text,
                  fontSize: 14,
                  fontWeight: fontFamily === f.key ? "600" : "400",
                }}
              >
                {f.label}
              </Text>
              <Text
                style={{
                  color: theme.textTertiary,
                  fontSize: 12,
                  marginTop: 2,
                  fontFamily: f.fontFamily,
                }}
              >
                {f.sample}
              </Text>
            </View>
            {fontFamily === f.key && (
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: theme.accent,
                }}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </BottomPanel>
  );
}

// ─── TOC panel ────────────────────────────────────────────────────────────────
function TocPanel({ visible, onClose, currentChIdx, onJump, theme, chapters: tocChapters }) {
  const [reversed, setReversed] = useState(false);
  const chapters = reversed ? [...tocChapters].reverse() : tocChapters;
  return (
    <BottomPanel
      visible={visible}
      onClose={onClose}
      title="目录"
      theme={theme}
      height={SH * 0.72}
    >
      <TouchableOpacity
        onPress={() => setReversed(!reversed)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          alignSelf: "flex-end",
          marginBottom: 16,
        }}
      >
        <RotateCcw size={13} color={theme.textSecondary} />
        <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
          反转顺序
        </Text>
      </TouchableOpacity>
      {chapters.map((ch, i) => {
        const realIdx = reversed ? tocChapters.length - 1 - i : i;
        const active = realIdx === currentChIdx;
        return (
          <TouchableOpacity
            key={ch.title + i}
            onPress={() => {
              onJump(realIdx);
              onClose();
            }}
            style={{
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: theme.readerMenuBorder,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 3,
                height: 18,
                borderRadius: 2,
                backgroundColor: active ? theme.accent : "transparent",
                marginRight: 12,
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
              {ch.title}
            </Text>
            {active && <ChevronRight size={16} color={theme.accent} />}
          </TouchableOpacity>
        );
      })}
    </BottomPanel>
  );
}

// ─── Bookmark panel ──────────────────────────────────────────────────────────
function BookmarkPanel({ visible, onClose, bookId, theme }) {
  const { getBookmarks, removeBookmark } = useReaderStore();
  const marks = getBookmarks(bookId);
  return (
    <BottomPanel
      visible={visible}
      onClose={onClose}
      title="书签"
      theme={theme}
      height={SH * 0.6}
    >
      {marks.length === 0 ? (
        <View style={{ alignItems: "center", paddingTop: 40, gap: 12 }}>
          <Bookmark size={44} color={theme.textTertiary} strokeWidth={1.4} />
          <Text style={{ color: theme.textTertiary, fontSize: 15 }}>
            还没有书签
          </Text>
          <Text style={{ color: theme.textTertiary, fontSize: 13 }}>
            点击顶栏书签图标添加
          </Text>
        </View>
      ) : (
        marks.map((m) => (
          <View
            key={m.id}
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: theme.readerMenuBorder,
            }}
          >
            <Bookmark
              size={15}
              color={theme.accent}
              style={{ marginTop: 2, marginRight: 12 }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{ color: theme.text, fontSize: 14, lineHeight: 20 }}
                numberOfLines={2}
              >
                {m.text}
              </Text>
              <Text
                style={{
                  color: theme.textTertiary,
                  fontSize: 11,
                  marginTop: 4,
                }}
              >
                {m.chapter} · {m.time}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => removeBookmark(bookId, m.id)}
              style={{ padding: 4 }}
            >
              <X size={16} color={theme.textTertiary} />
            </TouchableOpacity>
          </View>
        ))
      )}
    </BottomPanel>
  );
}

// ─── Progress slider ──────────────────────────────────────────────────────────
function ProgressSlider({ progress, onSeek, theme }) {
  const [barWidth, setBarWidth] = useState(SW - 80);
  const pct = clamp(progress, 0, 1);
  return (
    <TouchableOpacity
      activeOpacity={1}
      onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
      onPress={(e) => onSeek(clamp(e.nativeEvent.locationX / barWidth, 0, 1))}
      style={{ flex: 1, height: 24, justifyContent: "center" }}
    >
      <View
        style={{
          height: 3,
          backgroundColor: theme.progressBg,
          borderRadius: 2,
        }}
      >
        <View
          style={{
            width: `${Math.round(pct * 100)}%`,
            height: 3,
            backgroundColor: theme.progressFill,
            borderRadius: 2,
          }}
        />
      </View>
      <View
        style={{
          position: "absolute",
          left: `${Math.round(pct * 100)}%`,
          marginLeft: -7,
          top: 5,
          width: 14,
          height: 14,
          borderRadius: 7,
          backgroundColor: theme.progressFill,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.22,
          shadowRadius: 4,
        }}
      />
    </TouchableOpacity>
  );
}

// ─── Main reader ──────────────────────────────────────────────────────────────
export default function Reader() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { themeId, colorScheme, setTheme } = useThemeStore();
  const scheme = colorScheme || themeId || "minimal";
  const theme = THEMES[scheme] || THEMES.minimal;

  const books = useBookStore((s) => s.books);
  const updateProgress = useBookStore((s) => s.updateProgress);
  const {
    fontSize,
    lineHeight,
    letterSpacing,
    paragraphSpacing,
    fontWeight,
    fontFamily,
    marginH,
    marginTop,
    marginBottom,
    showHeader,
    showFooter,
    addBookmark,
    customFonts,
  } = useReaderStore();

  const loadChapter = useBookStore((s) => s.loadChapter);
  const book = books.find((b) => b.id === id) || books[0];
  const parsedChapters = book?._parsed?.chapters || [];
  const [chIdx, setChIdx] = useState(book?.currentChapter || 0);
  const [progress, setProgress] = useState(book?.progress || 0);
  const [chapterContent, setChapterContent] = useState("");
  const [loadingChapter, setLoadingChapter] = useState(false);
  const [loadedChapterIdx, setLoadedChapterIdx] = useState(-1);
  const [menuVisible, setMenuVisible] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showStyle, setShowStyle] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const menuOpacity = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef(null);

  const chapterInfo = parsedChapters[chIdx] || { title: "未知章节" };
  const chapter = {
    title: chapterInfo.title,
    content: chapterContent,
  };

  // Load chapter content when chapter index changes
  useEffect(() => {
    if (!book?._parsed || parsedChapters.length === 0) return;
    if (chIdx === loadedChapterIdx && chapterContent) return;
    let cancelled = false;
    setLoadingChapter(true);
    loadChapter(book.id, chIdx)
      .then((data) => {
        if (!cancelled) {
          setChapterContent(data.content);
          setLoadedChapterIdx(chIdx);
        }
      })
      .catch((err) => {
        console.error("Load chapter error:", err);
        if (!cancelled) setChapterContent("加载章节失败");
      })
      .finally(() => {
        if (!cancelled) setLoadingChapter(false);
      });
    return () => { cancelled = true; };
  }, [chIdx, book?.id, parsedChapters.length]);
  const pct = Math.round(progress * 100);

  // Resolve font family from built-in list OR custom imports
  const activeFontFamily = (() => {
    const builtin = BUILTIN_FONTS.find(
      (f) => f.key === (fontFamily || "System"),
    );
    if (builtin) return builtin.fontFamily;
    const custom = customFonts.find((f) => f.name === fontFamily);
    return custom ? custom.name : undefined;
  })();

  const handleScroll = useCallback(
    (evt) => {
      const { contentOffset, contentSize, layoutMeasurement } = evt.nativeEvent;
      const scrollable = contentSize.height - layoutMeasurement.height;
      if (scrollable <= 0) return;
      const chProg = contentOffset.y / scrollable;
      const overall = clamp(
        (chIdx + clamp(chProg, 0, 1)) / parsedChapters.length,
        0,
        1,
      );
      setProgress(overall);
      updateProgress(book?.id, overall);
    },
    [chIdx, parsedChapters.length, book?.id, updateProgress],
  );

  const toggleMenu = useCallback(() => {
    const next = !menuVisible;
    setMenuVisible(next);
    Animated.timing(menuOpacity, {
      toValue: next ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [menuVisible, menuOpacity]);

  const handleAddBookmark = useCallback(() => {
    const text = chapter.content.replace(/\s+/g, " ").slice(0, 80) + "…";
    addBookmark(book?.id, {
      text,
      chapter: chapter.title,
      time: new Date().toLocaleString("zh-CN", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      position: progress,
    });
    setBookmarked(true);
    setTimeout(() => setBookmarked(false), 2000);
  }, [chapter, book?.id, addBookmark, progress]);

  const jumpChapter = useCallback((idx) => {
    setChIdx(idx);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, []);

  const paragraphs = chapter.content.split("\n\n").filter(Boolean);
  const contentMaxWidth = IS_TABLET
    ? Math.min(SW - marginH * 2, 700)
    : SW - marginH * 2;

  return (
    <View style={{ flex: 1, backgroundColor: theme.readerBg }}>
      <StatusBar hidden />

      {/* Reading content */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={toggleMenu}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: marginH,
            paddingTop: (showHeader ? 36 : 16) + marginTop,
            paddingBottom: (showFooter ? 36 : 16) + marginBottom,
            // Tablet: center content
            alignItems: IS_TABLET ? "center" : undefined,
          }}
          onScroll={handleScroll}
          scrollEventThrottle={32}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ width: IS_TABLET ? contentMaxWidth : undefined }}>
            {/* Chapter title */}
            <Text
              style={{
                color: theme.readerText,
                fontSize: fontSize + 4,
                fontWeight: "700",
                marginBottom: 28,
                lineHeight: (fontSize + 4) * 1.5,
                fontFamily: activeFontFamily,
              }}
            >
              {chapter.title}
            </Text>
            {/* Paragraphs */}
            {paragraphs.map((para, i) => (
              <Text
                key={i}
                style={{
                  color: theme.readerText,
                  fontSize,
                  lineHeight: fontSize * lineHeight,
                  letterSpacing,
                  marginBottom: paragraphSpacing,
                  fontWeight,
                  fontFamily: activeFontFamily,
                }}
              >
                {para.trim()}
              </Text>
            ))}
            {/* Chapter nav */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 48,
                paddingTop: 24,
                borderTopWidth: 1,
                borderTopColor: theme.readerMenuBorder,
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  if (chIdx > 0) jumpChapter(chIdx - 1);
                }}
                disabled={chIdx === 0}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  opacity: chIdx === 0 ? 0.3 : 1,
                }}
              >
                <ChevronLeft size={16} color={theme.readerText} />
                <Text style={{ color: theme.readerText, fontSize: 14 }}>
                  上一章
                </Text>
              </TouchableOpacity>
              <Text style={{ color: theme.readerTextSecondary, fontSize: 13 }}>
                {chIdx + 1} / {parsedChapters.length}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (chIdx < parsedChapters.length - 1) jumpChapter(chIdx + 1);
                }}
                disabled={chIdx === parsedChapters.length - 1}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  opacity: chIdx === parsedChapters.length - 1 ? 0.3 : 1,
                }}
              >
                <Text style={{ color: theme.readerText, fontSize: 14 }}>
                  下一章
                </Text>
                <ChevronRight size={16} color={theme.readerText} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </TouchableOpacity>

      {/* ── Compact header — within margin area, no full-width bg ── */}
      {showHeader && !menuVisible && (
        <View
          style={{
            position: "absolute",
            top: (insets.top || 0) + 6,
            left: marginH,
            right: marginH,
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{ color: theme.readerTextSecondary, fontSize: 10 }}
            numberOfLines={1}
          >
            {book?.title}
          </Text>
          <Text
            style={{ color: theme.readerTextSecondary, fontSize: 10 }}
            numberOfLines={1}
          >
            {chapter.title}
          </Text>
        </View>
      )}

      {/* ── Compact footer — within margin area, no full-width bg ── */}
      {showFooter && !menuVisible && (
        <View
          style={{
            position: "absolute",
            bottom: (insets.bottom || 0) + 10,
            left: marginH,
            right: marginH,
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ color: theme.readerTextSecondary, fontSize: 10 }}>
            {chIdx + 1}/{parsedChapters.length}
          </Text>
          <Text style={{ color: theme.readerTextSecondary, fontSize: 10 }}>
            {pct}%
          </Text>
        </View>
      )}

      {/* ── Menu overlay ── */}
      {menuVisible && (
        <Animated.View
          pointerEvents="box-none"
          style={{ position: "absolute", inset: 0, opacity: menuOpacity }}
        >
          {/* Top bar */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              backgroundColor: theme.readerMenuBg,
              paddingTop: (insets.top || 0) + 4,
              paddingBottom: 14,
              paddingHorizontal: 16,
              flexDirection: "row",
              alignItems: "center",
              borderBottomWidth: 1,
              borderBottomColor: theme.readerMenuBorder,
            }}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ padding: 4, marginRight: 6 }}
            >
              <ChevronLeft size={24} color={theme.text} />
            </TouchableOpacity>
            <Text
              style={{
                flex: 1,
                color: theme.text,
                fontSize: 16,
                fontWeight: "600",
              }}
              numberOfLines={1}
            >
              {book?.title}
            </Text>
            <TouchableOpacity
              onPress={handleAddBookmark}
              style={{ padding: 4 }}
            >
              <Bookmark
                size={22}
                color={bookmarked ? theme.accent : theme.text}
                fill={bookmarked ? theme.accent : "none"}
                strokeWidth={1.8}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push(`/book-info/${book?.id}`)}
              style={{ padding: 4, marginLeft: 8 }}
            >
              <Info size={22} color={theme.text} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>

          {/* Bottom bar */}
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: theme.readerMenuBg,
              paddingTop: 14,
              paddingBottom: (insets.bottom || 0) + 16,
              paddingHorizontal: 20,
              borderTopWidth: 1,
              borderTopColor: theme.readerMenuBorder,
            }}
          >
            {/* Progress slider */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 20,
                gap: 10,
              }}
            >
              <Text style={{ color: theme.textTertiary, fontSize: 10 }}>
                0%
              </Text>
              <ProgressSlider
                progress={progress}
                theme={theme}
                onSeek={(p) => {
                  setProgress(p);
                  updateProgress(book?.id, p);
                  jumpChapter(
                    clamp(
                      Math.floor(p * parsedChapters.length),
                      0,
                      parsedChapters.length - 1,
                    ),
                  );
                }}
              />
              <Text style={{ color: theme.textTertiary, fontSize: 10 }}>
                100%
              </Text>
            </View>
            {/* Action row */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-around",
              }}
            >
              {[
                {
                  Icon: List,
                  label: "目录",
                  action: () => {
                    setShowToc(true);
                    setMenuVisible(false);
                  },
                },
                {
                  Icon: Bookmark,
                  label: "书签",
                  action: () => {
                    setShowBookmarks(true);
                    setMenuVisible(false);
                  },
                },
                {
                  Icon: Search,
                  label: "搜索",
                  action: () => router.push("/search"),
                },
                {
                  Icon: Settings2,
                  label: "样式",
                  action: () => {
                    setShowStyle(true);
                    setMenuVisible(false);
                  },
                },
              ].map(({ Icon, label, action }) => (
                <TouchableOpacity
                  key={label}
                  onPress={action}
                  style={{ alignItems: "center", gap: 6 }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: theme.accentSoft,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={20} color={theme.text} strokeWidth={1.8} />
                  </View>
                  <Text style={{ color: theme.textSecondary, fontSize: 11 }}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>
      )}

      <StylePanel
        visible={showStyle}
        onClose={() => setShowStyle(false)}
        theme={theme}
        themeId={scheme}
        setTheme={setTheme}
      />
      <TocPanel
        visible={showToc}
        onClose={() => setShowToc(false)}
        currentChIdx={chIdx}
        onJump={jumpChapter}
        theme={theme}
        chapters={parsedChapters}
      />
      <BookmarkPanel
        visible={showBookmarks}
        onClose={() => setShowBookmarks(false)}
        bookId={book?.id}
        theme={theme}
      />
    </View>
  );
}
