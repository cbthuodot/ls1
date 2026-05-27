import { create } from "zustand";

const useReaderStore = create((set, get) => ({
  // reading mode
  readMode: "scroll", // 'scroll' | 'page' | 'noAnim'
  // typography
  fontSize: 17,
  lineHeight: 1.85,
  letterSpacing: 0.3,
  paragraphSpacing: 12,
  fontFamily: "System",
  fontWeight: "400",
  // margins
  marginH: 20,
  marginTop: 12,
  marginBottom: 12,
  // header/footer
  showHeader: true,
  showFooter: true,
  headerContent: "chapter", // 'chapter' | 'title' | 'none'
  footerContent: "progress", // 'progress' | 'time' | 'pageNum' | 'none'
  // display
  showProgress: true,
  hideStatusBar: false,
  keepScreenOn: false,
  landscape: false,
  // auto scroll
  autoScroll: false,
  autoScrollSpeed: 1,
  // volume keys
  volumeKeys: true,
  // custom imported fonts: [{ name: string, uri: string }]
  customFonts: [],
  // bookmarks per book
  bookmarks: {},
  // current reading state
  currentBookId: null,
  currentPosition: 0, // 0-1

  setReadMode: (m) => set({ readMode: m }),
  setFontSize: (v) => set({ fontSize: Math.max(12, Math.min(30, v)) }),
  setLineHeight: (v) => set({ lineHeight: Math.max(1.2, Math.min(3.0, v)) }),
  setLetterSpacing: (v) => set({ letterSpacing: Math.max(0, Math.min(3, v)) }),
  setParagraphSpacing: (v) =>
    set({ paragraphSpacing: Math.max(0, Math.min(40, v)) }),
  setFontFamily: (f) => set({ fontFamily: f }),
  setFontWeight: (w) => set({ fontWeight: w }),
  setMarginH: (v) => set({ marginH: Math.max(0, Math.min(60, v)) }),
  setMarginTop: (v) => set({ marginTop: Math.max(0, Math.min(60, v)) }),
  setMarginBottom: (v) => set({ marginBottom: Math.max(0, Math.min(60, v)) }),
  toggleShowHeader: () => set((s) => ({ showHeader: !s.showHeader })),
  toggleShowFooter: () => set((s) => ({ showFooter: !s.showFooter })),
  setHeaderContent: (v) => set({ headerContent: v }),
  setFooterContent: (v) => set({ footerContent: v }),
  toggleHideStatusBar: () => set((s) => ({ hideStatusBar: !s.hideStatusBar })),
  toggleVolumeKeys: () => set((s) => ({ volumeKeys: !s.volumeKeys })),
  toggleAutoScroll: () => set((s) => ({ autoScroll: !s.autoScroll })),
  setAutoScrollSpeed: (v) => set({ autoScrollSpeed: v }),

  addCustomFont: (font) =>
    set((s) => ({
      customFonts: [...s.customFonts.filter((f) => f.name !== font.name), font],
    })),
  removeCustomFont: (name) =>
    set((s) => ({
      customFonts: s.customFonts.filter((f) => f.name !== name),
      // reset font if it was the active one
      fontFamily: s.fontFamily === name ? "System" : s.fontFamily,
    })),

  addBookmark: (bookId, bookmark) =>
    set((s) => {
      const existing = s.bookmarks[bookId] || [];
      return {
        bookmarks: {
          ...s.bookmarks,
          [bookId]: [{ ...bookmark, id: String(Date.now()) }, ...existing],
        },
      };
    }),

  removeBookmark: (bookId, markId) =>
    set((s) => ({
      bookmarks: {
        ...s.bookmarks,
        [bookId]: (s.bookmarks[bookId] || []).filter((m) => m.id !== markId),
      },
    })),

  getBookmarks: (bookId) => get().bookmarks[bookId] || [],

  setCurrentBook: (bookId, pos = 0) =>
    set({ currentBookId: bookId, currentPosition: pos }),
  setCurrentPosition: (pos) => set({ currentPosition: pos }),
}));

export default useReaderStore;
