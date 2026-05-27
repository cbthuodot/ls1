import { create } from "zustand";

// ─── 3 Color Palettes (Default + Reader styles) ────────────────────────────────
export const THEMES = {
  minimal: {
    id: "minimal",
    name: "极简留白",
    desc: "白底·克制·安静",
    bg: "#FFFFFF",
    surface: "#F8F9FA",
    surfaceAlt: "#F1F3F5",
    border: "#E9ECEF",
    borderLight: "#F4F5F7",
    text: "#1A1A1A",
    textSecondary: "#6B7280",
    textTertiary: "#9CA3AF",
    textInverse: "#FFFFFF",
    accent: "#1A1A1A",
    accentSoft: "#F1F3F5",
    accentText: "#FFFFFF",
    readerBg: "#FFFFFF",
    readerText: "#1A1A1A",
    readerTextSecondary: "#9CA3AF",
    readerHeaderBg: "rgba(255,255,255,0.92)",
    readerMenuBg: "#FFFFFF",
    readerMenuBorder: "#E9ECEF",
    cardBg: "#FFFFFF",
    cardBorder: "#E9ECEF",
    progressBg: "#E9ECEF",
    progressFill: "#1A1A1A",
    switchBg: "#D1D5DB",
    switchActive: "#1A1A1A",
    overlay: "rgba(0,0,0,0.4)",
    statusBar: "dark-content",
  },
  paper: {
    id: "paper",
    name: "纸感阅读",
    desc: "米色·温润·文学",
    bg: "#F4ECD8",
    surface: "#EDE0C4",
    surfaceAlt: "#E6D9B8",
    border: "#C8B89A",
    borderLight: "#DDD0B8",
    text: "#3B2A1A",
    textSecondary: "#7A5C40",
    textTertiary: "#A08060",
    textInverse: "#F4ECD8",
    accent: "#5C3D20",
    accentSoft: "#EDE0C4",
    accentText: "#F4ECD8",
    readerBg: "#F4ECD8",
    readerText: "#3B2A1A",
    readerTextSecondary: "#A08060",
    readerHeaderBg: "rgba(244,236,216,0.92)",
    readerMenuBg: "#EDE0C4",
    readerMenuBorder: "#C8B89A",
    cardBg: "#F4ECD8",
    cardBorder: "#C8B89A",
    progressBg: "#D4C4A4",
    progressFill: "#5C3D20",
    switchBg: "#C8B89A",
    switchActive: "#5C3D20",
    overlay: "rgba(30,15,5,0.5)",
    statusBar: "dark-content",
  },
  dark: {
    id: "dark",
    name: "深色专注",
    desc: "夜间·沉浸·护眼",
    bg: "#121212",
    surface: "#1E1E1E",
    surfaceAlt: "#252525",
    border: "#2C2C2C",
    borderLight: "#242424",
    text: "#E0E0E0",
    textSecondary: "#888888",
    textTertiary: "#5A5A5A",
    textInverse: "#121212",
    accent: "#D4D4D4",
    accentSoft: "#252525",
    accentText: "#121212",
    readerBg: "#121212",
    readerText: "#CCCCCC",
    readerTextSecondary: "#5A5A5A",
    readerHeaderBg: "rgba(18,18,18,0.92)",
    readerMenuBg: "#1E1E1E",
    readerMenuBorder: "#2C2C2C",
    cardBg: "#1E1E1E",
    cardBorder: "#2C2C2C",
    progressBg: "#2C2C2C",
    progressFill: "#D4D4D4",
    switchBg: "#3A3A3A",
    switchActive: "#D4D4D4",
    overlay: "rgba(0,0,0,0.7)",
    statusBar: "light-content",
  },
};

// ─── iOS 26 Liquid Glass — per color scheme ────────────────────────────────────
//
// Architecture: deep-saturated gradient "wall" + pure white/dark frosted panels
// The wall is the COLOR, the glass is the MATERIAL on top.
//
// Rim lighting = LinearGradient border (bright top-left → fade bottom-right)
// Specular = thin gradient fade at top of card interior (bright → transparent)
// Card fill = nearly-transparent tinted overlay on top of BlurView

export const GLASS_BG = {
  // "Ice" — pure arctic white glass over deep midnight indigo
  minimal: {
    // === Background wall ===
    gradient: ["#0c0a2e", "#1a1560", "#2e2894", "#1a1560"],
    gradientAngle: { x: 0.3, y: 0 }, // subtle diagonal

    // === BlurView config ===
    tint: "dark", // dark tint = white glass on dark bg
    blurIntensity: 90,

    // === Card glass ===
    cardFill: "rgba(255,255,255,0.10)", // nearly invisible fill on top of blur
    cardFillHover: "rgba(255,255,255,0.16)",

    // === Rim lighting (gradient border) ===
    // Goes: bright white top-left → mid → fade bottom-right
    rimTop: "rgba(255,255,255,0.72)",
    rimMid: "rgba(255,255,255,0.28)",
    rimBottom: "rgba(255,255,255,0.06)",

    // === Interior specular (top-of-card shine) ===
    specularColor: "rgba(255,255,255,0.22)", // applied as top gradient inside card
    specularHeight: 44,

    // === Typography ===
    textPrimary: "#FFFFFF",
    textSecondary: "rgba(255,255,255,0.75)",
    textMuted: "rgba(255,255,255,0.45)",

    // === Accent ===
    accentColor: "#93C5FD", // soft icy blue
    progressFill: "#93C5FD",
    progressBg: "rgba(147,197,253,0.20)",

    // === Tags / chips ===
    tagBg: "rgba(255,255,255,0.12)",
    tagBorder: "rgba(255,255,255,0.24)",

    // === Header bar ===
    headerFill: "rgba(12,10,46,0.72)", // very dark, almost opaque
    headerRimBottom: "rgba(255,255,255,0.15)",

    // === FAB ===
    fabFill: "rgba(255,255,255,0.15)",
    fabBorder: "rgba(255,255,255,0.45)",
    fabIconColor: "#FFFFFF",

    // === Sort sheet ===
    sheetBg: "rgba(12,10,46,0.85)",
    sheetBorder: "rgba(255,255,255,0.12)",

    statusBar: "light-content",
  },

  // "Ember" — warm amber glass over deep wine-crimson
  paper: {
    gradient: ["#1c0608", "#3d0f15", "#6b1e28", "#3d0f15"],
    gradientAngle: { x: 0.2, y: 0 },
    tint: "dark",
    blurIntensity: 88,
    cardFill: "rgba(255,220,180,0.08)",
    cardFillHover: "rgba(255,220,180,0.14)",
    rimTop: "rgba(255,200,120,0.70)",
    rimMid: "rgba(255,180,80,0.25)",
    rimBottom: "rgba(255,160,60,0.05)",
    specularColor: "rgba(255,220,170,0.20)",
    specularHeight: 40,
    textPrimary: "#FFF5E6",
    textSecondary: "rgba(255,235,200,0.80)",
    textMuted: "rgba(255,220,170,0.50)",
    accentColor: "#FBB96E",
    progressFill: "#FBB96E",
    progressBg: "rgba(251,185,110,0.20)",
    tagBg: "rgba(255,200,120,0.12)",
    tagBorder: "rgba(255,190,100,0.28)",
    headerFill: "rgba(28,6,8,0.78)",
    headerRimBottom: "rgba(255,180,80,0.18)",
    fabFill: "rgba(255,200,120,0.15)",
    fabBorder: "rgba(255,190,100,0.45)",
    fabIconColor: "#FBB96E",
    sheetBg: "rgba(28,6,8,0.90)",
    sheetBorder: "rgba(255,180,80,0.12)",
    statusBar: "light-content",
  },

  // "Void" — cold obsidian glass over near-black with electric cyan depth
  dark: {
    gradient: ["#000000", "#030510", "#060d20", "#030510"],
    gradientAngle: { x: 0.4, y: 0 },
    tint: "dark",
    blurIntensity: 85,
    cardFill: "rgba(180,220,255,0.04)",
    cardFillHover: "rgba(180,220,255,0.08)",
    rimTop: "rgba(100,180,255,0.45)",
    rimMid: "rgba(60,140,255,0.15)",
    rimBottom: "rgba(20,100,255,0.04)",
    specularColor: "rgba(120,200,255,0.12)",
    specularHeight: 36,
    textPrimary: "#E0EEFF",
    textSecondary: "rgba(180,220,255,0.72)",
    textMuted: "rgba(140,190,255,0.42)",
    accentColor: "#38BDF8",
    progressFill: "#38BDF8",
    progressBg: "rgba(56,189,248,0.18)",
    tagBg: "rgba(56,189,248,0.08)",
    tagBorder: "rgba(56,189,248,0.20)",
    headerFill: "rgba(0,0,0,0.82)",
    headerRimBottom: "rgba(56,189,248,0.15)",
    fabFill: "rgba(56,189,248,0.10)",
    fabBorder: "rgba(56,189,248,0.35)",
    fabIconColor: "#38BDF8",
    sheetBg: "rgba(0,0,0,0.92)",
    sheetBorder: "rgba(56,189,248,0.12)",
    statusBar: "light-content",
  },
};

// ─── Store ────────────────────────────────────────────────────────────────────
const useThemeStore = create((set) => ({
  uiStyle: "default", // 'default' | 'glass'
  colorScheme: "minimal",
  themeId: "minimal", // backward compat

  setUiStyle: (s) => set({ uiStyle: s }),
  setColorScheme: (id) => set({ colorScheme: id, themeId: id }),
  setTheme: (id) => set({ colorScheme: id, themeId: id }),

  customReaderBg: null,
  customReaderText: null,
  setCustomReaderBg: (c) => set({ customReaderBg: c }),
  setCustomReaderText: (c) => set({ customReaderText: c }),
  getTheme: () => THEMES["minimal"],
}));

export default useThemeStore;
