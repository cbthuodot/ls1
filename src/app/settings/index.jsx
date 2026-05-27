import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  Dimensions,
  Alert,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  X,
  FileText,
  BookOpen,
  Tag,
  Sliders,
  Info,
  ChevronRight,
  Check,
  Type,
  Trash2,
} from "lucide-react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Font from "expo-font";
import useThemeStore, { THEMES, GLASS_BG } from "../../store/useThemeStore";
import useReaderStore from "../../store/useReaderStore";

const { width: SW } = Dimensions.get("window");
const IS_TABLET = SW >= 600;

function SH({ label, theme }) {
  return (
    <Text
      style={{
        color: theme.textTertiary,
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 1.1,
        paddingHorizontal: 20,
        paddingTop: 30,
        paddingBottom: 10,
      }}
    >
      {label.toUpperCase()}
    </Text>
  );
}

function SR({ label, desc, icon: Icon, right, onPress, theme, noBorder }) {
  const content = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderBottomWidth: noBorder ? 0 : 1,
        borderBottomColor: theme.border,
      }}
    >
      {Icon && (
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: theme.surfaceAlt,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 14,
          }}
        >
          <Icon size={17} color={theme.textSecondary} strokeWidth={1.8} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.text, fontSize: 15 }}>{label}</Text>
        {desc && (
          <Text
            style={{ color: theme.textTertiary, fontSize: 12, marginTop: 2 }}
          >
            {desc}
          </Text>
        )}
      </View>
      {right}
    </View>
  );
  return onPress ? (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      {content}
    </TouchableOpacity>
  ) : (
    content
  );
}

// ─── Preview: Default style ────────────────────────────────────────────────────
function DefaultPreview({ isActive, onSelect }) {
  return (
    <TouchableOpacity
      onPress={onSelect}
      style={{ flex: 1 }}
      activeOpacity={0.85}
    >
      <View
        style={{
          height: IS_TABLET ? 140 : 118,
          borderRadius: 16,
          overflow: "hidden",
          borderWidth: 2,
          borderColor: isActive ? "#1A1A1A" : "#E9ECEF",
          backgroundColor: "#FFFFFF",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 4,
        }}
      >
        <View style={{ flex: 1, padding: 11 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 9,
              borderBottomWidth: 1,
              borderBottomColor: "#E9ECEF",
              paddingBottom: 7,
            }}
          >
            <View
              style={{
                width: 26,
                height: 5,
                borderRadius: 3,
                backgroundColor: "#1A1A1A",
              }}
            />
            <View style={{ flex: 1 }} />
            <View
              style={{
                width: 13,
                height: 13,
                borderRadius: 6.5,
                backgroundColor: "#E9ECEF",
              }}
            />
          </View>
          <View style={{ flexDirection: "row", gap: 5 }}>
            {["#667eea", "#f093fb", "#4facfe"].map((c, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 42,
                  borderRadius: 8,
                  overflow: "hidden",
                  shadowColor: c,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 5,
                  elevation: 2,
                }}
              >
                <View style={{ flex: 1, backgroundColor: c }} />
                <View
                  style={{
                    height: 13,
                    backgroundColor: "#fff",
                    borderTopWidth: 1,
                    borderTopColor: "#E9ECEF",
                    paddingHorizontal: 3,
                    justifyContent: "center",
                  }}
                >
                  <View
                    style={{
                      height: 2,
                      borderRadius: 1,
                      backgroundColor: "#E9ECEF",
                      width: "70%",
                    }}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 11,
            paddingBottom: 9,
          }}
        >
          <Text style={{ color: "#1A1A1A", fontSize: 11, fontWeight: "700" }}>
            默认
          </Text>
          {isActive && <Check size={12} color="#1A1A1A" />}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Preview: Glass style (with real BlurView + LinearGradient rim) ─────────────
function GlassPreview({ isActive, onSelect, scheme }) {
  const gb = GLASS_BG[scheme] || GLASS_BG.minimal;
  return (
    <TouchableOpacity
      onPress={onSelect}
      style={{ flex: 1 }}
      activeOpacity={0.85}
    >
      <View
        style={{
          height: IS_TABLET ? 140 : 118,
          borderRadius: 18,
          overflow: "hidden",
          borderWidth: isActive ? 2 : 1,
          borderColor: isActive ? gb.accentColor : "transparent",
          shadowColor: gb.accentColor,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.45,
          shadowRadius: 20,
          elevation: 10,
        }}
      >
        <LinearGradient
          colors={gb.gradient}
          start={{ x: gb.gradientAngle.x, y: 0 }}
          end={{ x: 1 - gb.gradientAngle.x, y: 1 }}
          style={{ position: "absolute", inset: 0 }}
        />
        {/* Frosted header */}
        <View style={{ overflow: "hidden", marginBottom: 7 }}>
          <BlurView intensity={gb.blurIntensity} tint={gb.tint}>
            <View
              style={{
                backgroundColor: gb.headerFill,
                paddingHorizontal: 10,
                paddingVertical: 7,
              }}
            >
              <LinearGradient
                colors={[gb.specularColor, "transparent"]}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 18,
                }}
              />
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: gb.textPrimary,
                    opacity: 0.6,
                  }}
                />
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: gb.tagBg,
                    marginLeft: 8,
                  }}
                />
              </View>
            </View>
          </BlurView>
        </View>
        {/* Mini glass cards */}
        <View style={{ flexDirection: "row", gap: 5, paddingHorizontal: 7 }}>
          {["#667eea", "#f093fb", "#4facfe"].map((c, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              <LinearGradient
                colors={[gb.rimTop, gb.rimMid, gb.rimBottom]}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.6, y: 1 }}
                style={{ position: "absolute", inset: 0, borderRadius: 10 }}
              />
              <View
                style={{
                  margin: 1,
                  borderRadius: 9,
                  overflow: "hidden",
                  flex: 1,
                }}
              >
                <BlurView
                  intensity={gb.blurIntensity}
                  tint={gb.tint}
                  style={{ flex: 1 }}
                >
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: gb.cardFill,
                      padding: 5,
                    }}
                  >
                    <LinearGradient
                      colors={[gb.specularColor, "transparent"]}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 14,
                        borderRadius: 9,
                      }}
                    />
                    <View
                      style={{
                        width: 14,
                        height: 2.5,
                        borderRadius: 1.5,
                        backgroundColor: c,
                        marginBottom: 3,
                        shadowColor: c,
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.9,
                        shadowRadius: 3,
                      }}
                    />
                    <View
                      style={{
                        height: 2,
                        borderRadius: 1,
                        backgroundColor: gb.textPrimary,
                        width: "80%",
                        opacity: 0.5,
                      }}
                    />
                  </View>
                </BlurView>
              </View>
            </View>
          ))}
        </View>
        {/* Label */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: 8,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ overflow: "hidden", borderRadius: 7 }}>
            <BlurView intensity={60} tint={gb.tint}>
              <View
                style={{
                  backgroundColor: gb.tagBg,
                  paddingHorizontal: 7,
                  paddingVertical: 3,
                }}
              >
                <Text
                  style={{
                    color: gb.textPrimary,
                    fontSize: 10,
                    fontWeight: "700",
                  }}
                >
                  玻璃
                </Text>
              </View>
            </BlurView>
          </View>
          {isActive && (
            <View
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: gb.accentColor,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Check size={10} color="#fff" />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Color scheme mini card ────────────────────────────────────────────────────
function SchemeCard({ scheme, isActive, onSelect, uiStyle }) {
  const gb = GLASS_BG[scheme];
  const th = THEMES[scheme];
  const labels = { minimal: "极简留白", paper: "纸感阅读", dark: "深色专注" };
  const descs = {
    minimal: "清冽·午夜蓝紫",
    paper: "热烈·深红琥珀",
    dark: "冷峻·暗夜深蓝",
  };
  return (
    <TouchableOpacity
      onPress={onSelect}
      activeOpacity={0.82}
      style={{
        flex: 1,
        height: IS_TABLET ? 90 : 76,
        borderRadius: 14,
        overflow: "hidden",
        borderWidth: isActive ? 2.5 : 1.5,
        borderColor: isActive
          ? uiStyle === "glass"
            ? gb.accentColor
            : th.accent
          : uiStyle === "glass"
            ? gb.tagBorder
            : th.border,
      }}
    >
      {uiStyle === "glass" ? (
        <>
          <LinearGradient
            colors={gb.gradient}
            start={{ x: gb.gradientAngle.x, y: 0 }}
            end={{ x: 1 - gb.gradientAngle.x, y: 1 }}
            style={{ position: "absolute", inset: 0 }}
          />
          <View
            style={{ flex: 1, padding: 10, justifyContent: "space-between" }}
          >
            <View style={{ flexDirection: "row", gap: 3 }}>
              {["#667eea", "#f093fb", "#4facfe"].map((c, i) => (
                <View
                  key={i}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 3.5,
                    backgroundColor: c,
                    shadowColor: c,
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.9,
                    shadowRadius: 3,
                  }}
                />
              ))}
            </View>
            <View>
              <Text
                style={{
                  color: gb.textPrimary,
                  fontSize: 11,
                  fontWeight: "700",
                }}
              >
                {labels[scheme]}
              </Text>
              <Text style={{ color: gb.textMuted, fontSize: 9, marginTop: 1 }}>
                {descs[scheme]}
              </Text>
            </View>
          </View>
        </>
      ) : (
        <View
          style={{
            flex: 1,
            backgroundColor: th.bg,
            padding: 10,
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", gap: 3 }}>
            {["#667eea", "#f093fb", "#4facfe"].map((c, i) => (
              <View
                key={i}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 3.5,
                  backgroundColor: c,
                }}
              />
            ))}
          </View>
          <View>
            <Text style={{ color: th.text, fontSize: 11, fontWeight: "700" }}>
              {labels[scheme]}
            </Text>
            <Text style={{ color: th.textTertiary, fontSize: 9, marginTop: 1 }}>
              {th.desc}
            </Text>
          </View>
        </View>
      )}
      {isActive && (
        <View
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: uiStyle === "glass" ? gb.accentColor : th.accent,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Check size={9} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Font import handler ───────────────────────────────────────────────────────
async function doImportFont(addCustomFont) {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type:
        Platform.OS === "ios"
          ? ["public.truetype-ttf-font", "com.adobe.postscript-font"]
          : ["font/ttf", "font/otf", "application/x-font-ttf", "*/*"],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.length) return null;
    const file = result.assets[0];
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["ttf", "otf"].includes(ext)) {
      Alert.alert("格式不支持", "请选择 .ttf 或 .otf 字体文件");
      return null;
    }
    const fontName = file.name.replace(/\.(ttf|otf)$/i, "");
    const dir = FileSystem.documentDirectory + "fonts/";
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    const dest = dir + file.name;
    await FileSystem.copyAsync({ from: file.uri, to: dest });
    await Font.loadAsync({ [fontName]: { uri: dest } });
    addCustomFont({ name: fontName, uri: dest, file: file.name });
    return fontName;
  } catch (e) {
    Alert.alert("导入失败", e.message || "未知错误");
    return null;
  }
}

// ─── Settings page ─────────────────────────────────────────────────────────────
export default function Settings() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { uiStyle, colorScheme, setUiStyle, setColorScheme, themeId } =
    useThemeStore();
  const theme = THEMES[colorScheme] || THEMES.minimal;
  const scheme = colorScheme || themeId || "minimal";

  const {
    showHeader,
    toggleShowHeader,
    showFooter,
    toggleShowFooter,
    hideStatusBar,
    toggleHideStatusBar,
    volumeKeys,
    toggleVolumeKeys,
    customFonts,
    addCustomFont,
    removeCustomFont,
  } = useReaderStore();
  const [defaultScreen, setDefaultScreen] = useState("shelf");
  const [importing, setImporting] = useState(false);

  const handleImportFont = async () => {
    setImporting(true);
    const name = await doImportFont(addCustomFont);
    setImporting(false);
    if (name)
      Alert.alert(
        "导入成功",
        `字体「${name}」已导入，可在阅读器样式面板中选择使用。`,
      );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={theme.statusBar || "dark-content"} />
      {/* Header */}
      <View
        style={{
          backgroundColor: theme.bg,
          paddingTop: insets.top + 4,
          paddingBottom: 14,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
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
          设置
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={22} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 48 }}
      >
        {/* ── UI Style ── */}
        <SH label="界面设计风格" theme={theme} />
        <View style={{ paddingHorizontal: 20 }}>
          <Text
            style={{
              color: theme.textSecondary,
              fontSize: 13,
              marginBottom: 16,
              lineHeight: 19,
            }}
          >
            两套完全不同的视觉风格，玻璃风格呈现 iOS 26 Liquid Glass
            质感。每套均支持三种主色调。
          </Text>
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 22 }}>
            <DefaultPreview
              isActive={uiStyle === "default"}
              onSelect={() => setUiStyle("default")}
            />
            <GlassPreview
              isActive={uiStyle === "glass"}
              onSelect={() => setUiStyle("glass")}
              scheme={scheme}
            />
          </View>
          <Text
            style={{
              color: theme.textTertiary,
              fontSize: 11,
              fontWeight: "700",
              letterSpacing: 1,
              marginBottom: 12,
            }}
          >
            主色调
          </Text>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 4 }}>
            {["minimal", "paper", "dark"].map((s) => (
              <SchemeCard
                key={s}
                scheme={s}
                isActive={scheme === s}
                uiStyle={uiStyle}
                onSelect={() => setColorScheme(s)}
              />
            ))}
          </View>
        </View>

        {/* ── Reader ── */}
        <SH label="阅读设置" theme={theme} />
        <View
          style={{
            backgroundColor: theme.surface,
            borderRadius: 16,
            marginHorizontal: 20,
            borderWidth: 1,
            borderColor: theme.border,
            overflow: "hidden",
          }}
        >
          <SR
            label="显示页眉"
            desc="顶部显示书名与章节"
            icon={FileText}
            theme={theme}
            right={
              <Switch
                value={showHeader}
                onValueChange={toggleShowHeader}
                trackColor={{ false: theme.switchBg, true: theme.switchActive }}
                thumbColor="#fff"
              />
            }
          />
          <SR
            label="显示页脚"
            desc="底部显示进度信息"
            icon={FileText}
            theme={theme}
            right={
              <Switch
                value={showFooter}
                onValueChange={toggleShowFooter}
                trackColor={{ false: theme.switchBg, true: theme.switchActive }}
                thumbColor="#fff"
              />
            }
          />
          <SR
            label="隐藏状态栏"
            desc="全屏沉浸阅读"
            icon={Sliders}
            theme={theme}
            right={
              <Switch
                value={hideStatusBar}
                onValueChange={toggleHideStatusBar}
                trackColor={{ false: theme.switchBg, true: theme.switchActive }}
                thumbColor="#fff"
              />
            }
          />
          <SR
            label="音量键翻页"
            desc="使用音量+/− 键翻页"
            icon={Sliders}
            theme={theme}
            noBorder
            right={
              <Switch
                value={volumeKeys}
                onValueChange={toggleVolumeKeys}
                trackColor={{ false: theme.switchBg, true: theme.switchActive }}
                thumbColor="#fff"
              />
            }
          />
        </View>

        {/* ── Fonts ── */}
        <SH label="字体管理" theme={theme} />
        <View style={{ marginHorizontal: 20 }}>
          <Text
            style={{
              color: theme.textSecondary,
              fontSize: 13,
              marginBottom: 14,
              lineHeight: 19,
            }}
          >
            可导入本地 .ttf / .otf 字体，导入后在阅读器「样式」面板中选用。
            {"\n"}
            iOS 内置 SF Pro · New York · Georgia · Palatino · Helvetica
            Neue，无需额外导入。
          </Text>
          {/* Built-in fonts preview */}
          <View
            style={{
              backgroundColor: theme.surface,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: theme.border,
              padding: 14,
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                color: theme.text,
                fontSize: 14,
                fontWeight: "600",
                marginBottom: 10,
              }}
            >
              系统内置字体
            </Text>
            {[
              {
                name: "系统默认 (SF Pro / Roboto)",
                font: undefined,
                sample: "春眠不觉晓 Hello",
              },
              {
                name: "New York（仅 iOS）",
                font: Platform.OS === "ios" ? "New York" : "serif",
                sample: "春眠不觉晓 Hello",
              },
              { name: "Georgia", font: "Georgia", sample: "In the beginning…" },
              {
                name: "Palatino",
                font: Platform.OS === "ios" ? "Palatino" : "serif",
                sample: "Once upon a time",
              },
              {
                name: "Helvetica Neue（仅 iOS）",
                font: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif",
                sample: "Clean & modern",
              },
              { name: "衬线体 (Serif)", font: "serif", sample: "春眠不觉晓" },
              {
                name: "等宽体 (Mono)",
                font: "monospace",
                sample: 'print("hello")',
              },
            ].map((f, i, arr) => (
              <View
                key={f.name}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 8,
                  borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                  borderBottomColor: theme.border,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontSize: 13 }}>
                    {f.name}
                  </Text>
                </View>
                <Text
                  style={{
                    fontFamily: f.font,
                    color: theme.textSecondary,
                    fontSize: 13,
                  }}
                >
                  {f.sample}
                </Text>
              </View>
            ))}
          </View>

          {/* Imported fonts */}
          {customFonts.length > 0 && (
            <View
              style={{
                backgroundColor: theme.surface,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: theme.border,
                padding: 14,
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  color: theme.text,
                  fontSize: 14,
                  fontWeight: "600",
                  marginBottom: 10,
                }}
              >
                已导入字体
              </Text>
              {customFonts.map((f, i) => (
                <View
                  key={f.name}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 10,
                    borderBottomWidth: i < customFonts.length - 1 ? 1 : 0,
                    borderBottomColor: theme.border,
                  }}
                >
                  <Type
                    size={16}
                    color={theme.textSecondary}
                    style={{ marginRight: 12 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: theme.text,
                        fontSize: 14,
                        fontFamily: f.name,
                      }}
                    >
                      {f.name}
                    </Text>
                    <Text
                      style={{
                        color: theme.textTertiary,
                        fontSize: 11,
                        marginTop: 1,
                      }}
                    >
                      {f.file}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert("删除字体", `确认删除「${f.name}」？`, [
                        { text: "取消", style: "cancel" },
                        {
                          text: "删除",
                          style: "destructive",
                          onPress: () => removeCustomFont(f.name),
                        },
                      ])
                    }
                    style={{ padding: 4 }}
                  >
                    <Trash2 size={16} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Import button */}
          <TouchableOpacity
            onPress={handleImportFont}
            disabled={importing}
            style={{
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: theme.accent,
              borderStyle: "dashed",
              paddingVertical: 14,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
              backgroundColor: theme.surface,
              opacity: importing ? 0.6 : 1,
            }}
          >
            <Type size={18} color={theme.accent} />
            <Text
              style={{ color: theme.accent, fontSize: 15, fontWeight: "600" }}
            >
              {importing ? "导入中…" : "导入本地字体 (.ttf / .otf)"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Startup ── */}
        <SH label="启动行为" theme={theme} />
        <View
          style={{
            backgroundColor: theme.surface,
            borderRadius: 16,
            marginHorizontal: 20,
            borderWidth: 1,
            borderColor: theme.border,
            overflow: "hidden",
          }}
        >
          {[
            { key: "shelf", label: "进入书架", desc: "每次启动打开书架" },
            { key: "lastRead", label: "继续阅读", desc: "跳转到上次位置" },
          ].map((opt, i) => (
            <TouchableOpacity
              key={opt.key}
              onPress={() => setDefaultScreen(opt.key)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 14,
                paddingHorizontal: 20,
                borderBottomWidth: i === 0 ? 1 : 0,
                borderBottomColor: theme.border,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontSize: 15 }}>
                  {opt.label}
                </Text>
                <Text
                  style={{
                    color: theme.textTertiary,
                    fontSize: 12,
                    marginTop: 2,
                  }}
                >
                  {opt.desc}
                </Text>
              </View>
              {defaultScreen === opt.key && (
                <Check size={18} color={theme.accent} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Files ── */}
        <SH label="文件管理" theme={theme} />
        <View
          style={{
            backgroundColor: theme.surface,
            borderRadius: 16,
            marginHorizontal: 20,
            borderWidth: 1,
            borderColor: theme.border,
            overflow: "hidden",
          }}
        >
          <SR
            label="本地导入"
            desc="从文件夹或选择器导入书籍"
            icon={BookOpen}
            theme={theme}
            onPress={() => router.push("/import")}
            right={<ChevronRight size={18} color={theme.textTertiary} />}
          />
          <SR
            label="TXT 目录规则"
            desc="设置章节识别正则"
            icon={Tag}
            theme={theme}
            onPress={() => {}}
            noBorder
            right={<ChevronRight size={18} color={theme.textTertiary} />}
          />
        </View>

        {/* ── About + Download ── */}
        <SH label="关于 & 打包" theme={theme} />
        <View
          style={{
            backgroundColor: theme.surface,
            borderRadius: 16,
            marginHorizontal: 20,
            borderWidth: 1,
            borderColor: theme.border,
            overflow: "hidden",
          }}
        >
          <SR
            label="版本"
            icon={Info}
            theme={theme}
            right={
              <Text style={{ color: theme.textTertiary, fontSize: 14 }}>
                1.0.0
              </Text>
            }
          />
          <SR
            label="打包 APK"
            icon={Info}
            theme={theme}
            noBorder
            desc="设置页底部查看详细步骤"
            right={<ChevronRight size={18} color={theme.textTertiary} />}
          />
        </View>

        {/* How to build APK */}
        <View
          style={{
            backgroundColor: theme.surface,
            borderRadius: 16,
            marginHorizontal: 20,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 16,
            marginTop: 12,
          }}
        >
          <Text
            style={{
              color: theme.text,
              fontSize: 14,
              fontWeight: "700",
              marginBottom: 12,
            }}
          >
            📦 如何下载项目并打包 APK
          </Text>
          {[
            {
              step: "①",
              desc: "点击 Anything 平台右上角菜单 → 「Download Project」下载源码 ZIP",
            },
            { step: "②", desc: "解压，终端进入目录，运行 npm install" },
            { step: "③", desc: "安装 EAS CLI：npm install -g eas-cli" },
            {
              step: "④",
              desc: "登录 Expo 账号：eas login（免费注册 expo.dev）",
            },
            { step: "⑤", desc: "初始化：eas build:configure（选 Android）" },
            {
              step: "⑥",
              desc: "打包 APK：eas build --platform android --profile preview",
            },
            {
              step: "⑦",
              desc: "或用 Codex CLI 在本地执行上述命令，Codex 可读取代码帮助排查",
            },
          ].map((s) => (
            <View
              key={s.step}
              style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}
            >
              <Text
                style={{
                  color: theme.accent,
                  fontSize: 13,
                  fontWeight: "700",
                  minWidth: 20,
                }}
              >
                {s.step}
              </Text>
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: 13,
                  flex: 1,
                  lineHeight: 19,
                }}
              >
                {s.desc}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
