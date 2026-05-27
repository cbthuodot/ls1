import { NativeModules } from "react-native";

const { BookParser } = NativeModules;

export interface ChapterInfo {
  title: string;
  index: number;
  startOffset?: number;
  endOffset?: number;
  href?: string;
}

export interface ParsedBook {
  id: string;
  type: "txt" | "epub";
  title: string;
  author: string;
  format: string;
  path: string;
  fileSize: number;
  charset?: string;
  totalChars?: number;
  description?: string;
  coverHref?: string;
  totalChapters: number;
  chapters: ChapterInfo[];
}

export async function parseBook(uri: string, originalName?: string): Promise<ParsedBook> {
  return BookParser.parseBook(uri, originalName || "");
}

export async function readChapter(
  filePath: string,
  chapterIndex: number
): Promise<string> {
  return BookParser.readChapter(filePath, chapterIndex);
}

export async function getCoverPath(filePath: string): Promise<string | null> {
  return BookParser.getCoverPath(filePath);
}
