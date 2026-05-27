import { create } from "zustand";
import { parseBook, readChapter } from "../bridge/BookParser";

const COVER_COLORS = [
  ["#667eea", "#764ba2"], ["#f093fb", "#f5576c"],
  ["#4facfe", "#00f2fe"], ["#43e97b", "#38f9d7"],
  ["#fa709a", "#fee140"], ["#a18cd1", "#fbc2eb"],
  ["#fccb90", "#d57eeb"], ["#a1c4fd", "#c2e9fb"],
  ["#fd7043", "#ff8a65"], ["#66bb6a", "#81c784"],
  ["#42a5f5", "#64b5f6"], ["#ab47bc", "#ba68c8"],
  ["#FF6B6B", "#FF8E53"], ["#4158D0", "#C850C0"],
  ["#0093E9", "#80D0C7"], ["#8EC5FC", "#E0C3FC"],
  ["#FBAB7E", "#F7CE68"], ["#85FFBD", "#FFFB7D"],
];

function getCoverColor(title) {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COVER_COLORS[Math.abs(hash) % COVER_COLORS.length];
}

export function getReaderType(format) {
  if (!format) return "text";
  const f = format.toUpperCase();
  if (f === "ZIP" || f === "CBZ" || f === "CBR") return "manga";
  if (f === "PDF") return "pdf";
  return "text";
}

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatWordCount(count) {
  if (!count) return "";
  if (count >= 10000) return (count / 10000).toFixed(1) + "万字";
  return count.toLocaleString() + "字";
}

export const FILE_TYPE_TABS = [
  { key: "all", label: "全部" },
  { key: "TXT", label: "TXT" },
  { key: "EPUB", label: "EPUB" },
  { key: "PDF", label: "PDF" },
  { key: "ZIP", label: "漫画" },
];

const useBookStore = create((set, get) => ({
  books: [],
  viewMode: "grid",
  sortBy: "lastRead",
  activeFileType: "all",
  selectedIds: [],
  isSelecting: false,

  getCoverColor,

  importBook: async (uri, originalName) => {
    try {
      const parsed = await parseBook(uri, originalName);
      const existingIdx = get().books.findIndex(
        (b) => b._parsedPath === parsed.path
      );
      if (existingIdx >= 0) {
        const updated = [...get().books];
        updated[existingIdx] = {
          ...updated[existingIdx],
          path: parsed.path,
          _parsedPath: parsed.path,
          _parsed: parsed,
        };
        set({ books: updated });
        return updated[existingIdx];
      }

      const book = {
        id: String(Date.now()),
        title: parsed.title || "未知书名",
        author: parsed.author || "未知作者",
        format: parsed.format || "TXT",
        size: formatFileSize(parsed.fileSize),
        words: parsed.totalChars
          ? formatWordCount(parsed.totalChars)
          : "",
        progress: 0,
        lastRead: "从未阅读",
        lastReadTs: 0,
        path: parsed.path,
        _parsedPath: parsed.path,
        _parsed: parsed,
        addedAt: Date.now(),
        totalChapters: parsed.totalChapters || 0,
        currentChapter: 0,
        currentChapterPos: 0,
        bookmarks: 0,
        description: parsed.description || "",
        coverColors: getCoverColor(parsed.title || ""),
        ...(parsed.type === "epub" ? { coverPath: parsed.coverHref } : {}),
      };

      set((s) => ({ books: [book, ...s.books] }));
      return book;
    } catch (e) {
      console.error("Import failed:", e);
      throw e;
    }
  },

  loadChapter: async (bookId, chapterIndex) => {
    const book = get().books.find((b) => b.id === bookId);
    if (!book?._parsed) throw new Error("Book not found");
    const content = await readChapter(book._parsedPath, chapterIndex);
    return {
      title: book._parsed.chapters[chapterIndex]?.title || "未知章节",
      content,
    };
  },

  getFilteredBooks: (query = "", fileType = "all") => {
    let books = get().books;
    if (fileType !== "all") books = books.filter((b) => b.format === fileType);
    if (query) {
      const q = query.toLowerCase();
      books = books.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          (b.author || "").toLowerCase().includes(q)
      );
    }
    const sortBy = get().sortBy;
    return [...books].sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "progress") return b.progress - a.progress;
      if (sortBy === "addedAt") return b.addedAt - a.addedAt;
      return (b.lastReadTs || 0) - (a.lastReadTs || 0);
    });
  },

  updateProgress: (id, progress, chapterIndex, chapterPos) =>
    set((s) => ({
      books: s.books.map((b) =>
        b.id === id
          ? {
              ...b,
              progress,
              currentChapter: chapterIndex ?? b.currentChapter,
              currentChapterPos: chapterPos ?? b.currentChapterPos,
              lastReadTs: Date.now(),
              lastRead: "刚刚",
            }
          : b
      ),
    })),

  removeBook: (id) =>
    set((s) => ({ books: s.books.filter((b) => b.id !== id) })),
  setViewMode: (viewMode) => set({ viewMode }),
  setSortBy: (sortBy) => set({ sortBy }),
  setActiveFileType: (t) => set({ activeFileType: t }),

  toggleSelect: (id) =>
    set((s) => ({
      selectedIds: s.selectedIds.includes(id)
        ? s.selectedIds.filter((i) => i !== id)
        : [...s.selectedIds, id],
    })),
  startSelecting: () => set({ isSelecting: true, selectedIds: [] }),
  endSelecting: () => set({ isSelecting: false, selectedIds: [] }),
  removeSelected: () =>
    set((s) => ({
      books: s.books.filter((b) => !s.selectedIds.includes(b.id)),
      selectedIds: [],
      isSelecting: false,
    })),
}));

export default useBookStore;
