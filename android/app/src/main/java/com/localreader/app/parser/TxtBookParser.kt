package com.localreader.app.parser

import com.ibm.icu.text.CharsetDetector
import java.io.File
import java.nio.charset.Charset

data class TxtChapterInfo(
    val title: String,
    val startIndex: Int,
    val endIndex: Int
)

data class TxtBookInfo(
    val title: String,
    val author: String = "",
    val charset: String = "UTF-8",
    val chapters: List<TxtChapterInfo> = emptyList(),
    val fullContent: String = "",
    val totalChars: Long = 0,
    val fileSize: Long = 0
)

object TxtBookParser {

    private val CHAPTER_REGEX = listOf(
        Regex("""^\s*(第\s*[0-9零一二三四五六七八九十百千万]+\s*[章回节卷集部篇])"""),
        Regex("""^\s*(Chapter\s*\d+)""", RegexOption.IGNORE_CASE),
        Regex("""^\s*(楔子|序章|序言|前言|尾声|后记|番外|引子)"""),
        Regex("""^\s*正文\s*$"""),
    )

    private val COMMON_CHINESE_ENCODINGS = listOf(
        "GB18030", "GBK", "GB2312", "Big5", "Big5-HKSCS",
        "UTF-8", "UTF-16LE", "UTF-16BE", "windows-1252"
    )

    fun detectCharset(fileBytes: ByteArray): String {
        // 1. Check BOM
        if (fileBytes.size >= 3 &&
            fileBytes[0] == 0xEF.toByte() && fileBytes[1] == 0xBB.toByte() && fileBytes[2] == 0xBF.toByte()
        ) {
            return "UTF-8"
        }
        if (fileBytes.size >= 2 &&
            fileBytes[0] == 0xFF.toByte() && fileBytes[1] == 0xFE.toByte()
        ) {
            return "UTF-16LE"
        }
        if (fileBytes.size >= 2 &&
            fileBytes[0] == 0xFE.toByte() && fileBytes[1] == 0xFF.toByte()
        ) {
            return "UTF-16BE"
        }

        // 2. Try ICU4J charset detection
        try {
            val detector = CharsetDetector()
            detector.setText(fileBytes)

            // Try all declared matches
            val matches = detector.detectAll()
            if (matches != null && matches.isNotEmpty()) {
                // Get the best match
                val best = matches[0]
                if (best.confidence >= 15) {
                    val name = best.name
                    // Normalize encoding names
                    return when {
                        name.equals("GB2312", ignoreCase = true) -> "GBK"
                        name.equals("GB18030", ignoreCase = true) -> "GBK"
                        name.equals("ISO-8859-1", ignoreCase = true) -> "windows-1252"
                        name.equals("Big5", ignoreCase = true) -> "Big5"
                        name.equals("EUC-KR", ignoreCase = true) -> "EUC-KR"
                        name.equals("Shift_JIS", ignoreCase = true) -> "Shift_JIS"
                        name.equals("EUC-JP", ignoreCase = true) -> "EUC-JP"
                        else -> name
                    }
                }
            }
        } catch (_: Exception) {
        }

        // 3. Heuristic: try common Chinese encodings and check readability
        for (encoding in COMMON_CHINESE_ENCODINGS) {
            try {
                val test = String(fileBytes.take(minOf(fileBytes.size, 10000)).toByteArray(), charset(encoding))
                // Count CJK characters
                val cjkCount = test.count { isCjk(it) }
                val totalChars = test.length
                if (totalChars > 0 && cjkCount.toFloat() / totalChars > 0.15f) {
                    return when (encoding) {
                        "GB2312" -> "GBK"
                        "GB18030" -> "GBK"
                        else -> encoding
                    }
                }
            } catch (_: Exception) {
            }
        }

        // 4. Last resort: try GBK (most common for Chinese TXT) then UTF-8
        try {
            // Quick GBK check
            val gbkTest = String(fileBytes.take(minOf(fileBytes.size, 10000)).toByteArray(), charset("GBK"))
            val cjk = gbkTest.count { isCjk(it) }
            if (cjk > 0 && cjk.toFloat() / maxOf(gbkTest.length, 1) > 0.1f) {
                return "GBK"
            }
        } catch (_: Exception) {
        }

        return "UTF-8"
    }

    private fun isCjk(ch: Char): Boolean {
        val cp = ch.code
        return (cp in 0x4E00..0x9FFF) ||   // CJK Unified
                (cp in 0x3400..0x4DBF) ||   // CJK Extension A
                (cp in 0x20000..0x2A6DF) || // CJK Extension B
                (cp in 0xF900..0xFAFF) ||   // CJK Compatibility
                (cp in 0x2F800..0x2FA1F)    // CJK Compatibility Supplement
    }

    fun parse(filePath: String, suggestedTitle: String? = null): TxtBookInfo {
        val file = File(filePath)
        if (!file.exists()) throw IllegalStateException("File not found: $filePath")

        val bytes = file.readBytes()
        if (bytes.isEmpty()) {
            return TxtBookInfo(
                title = suggestedTitle?.removeSuffix(".txt")?.removeSuffix(".TXT") ?: "空文件",
                fileSize = 0
            )
        }

        val charset = detectCharset(bytes)
        val content = String(bytes, charset(charset))
        val chapters = findChapters(content)
        val title = suggestedTitle?.removeSuffix(".txt")?.removeSuffix(".TXT")
            ?: file.nameWithoutExtension.replace(Regex("""[\-_【】\[\]].*"""), "").trim()

        return TxtBookInfo(
            title = title.ifEmpty { file.name },
            charset = charset,
            chapters = chapters,
            fullContent = content,
            totalChars = content.codePointCount(0, content.length).toLong(),
            fileSize = file.length()
        )
    }

    fun readChapter(filePath: String, chapter: TxtChapterInfo): String {
        val endIdx = chapter.endIndex.coerceAtMost(10000000)
        return try {
            // Use the pre-parsed full content if available, otherwise re-read
            val file = File(filePath)
            val bytes = file.readBytes()
            val charset = detectCharset(bytes)
            val content = String(bytes, charset(charset))
            content.substring(chapter.startIndex, endIdx)
        } catch (e: Exception) {
            "(读取失败: ${e.message})"
        }
    }

    private fun findChapters(content: String): List<TxtChapterInfo> {
        val lines = content.lines()
        if (lines.isEmpty()) return emptyList()

        val matches = mutableListOf<Pair<Int, String>>()

        for ((i, line) in lines.withIndex()) {
            val trimmed = line.trim()
            if (trimmed.isEmpty() || trimmed.length > 60) continue
            for (regex in CHAPTER_REGEX) {
                val m = regex.find(trimmed)
                if (m != null && m.value.length >= 2 && trimmed.length <= 40) {
                    matches.add(i to m.value.take(30))
                    break
                }
            }
        }

        if (matches.isEmpty()) {
            return autoSplit(lines)
        }

        if (matches.size == 1) {
            // Only one chapter heading found - split before and after
            val (lineIdx, _) = matches[0]
            if (lineIdx <= 3) {
                // Heading near the beginning - treat everything after as the chapter
                val startIndex = getCharIndex(content, lines, lineIdx)
                return listOf(
                    TxtChapterInfo("前言", 0, startIndex),
                    TxtChapterInfo(matches[0].second, startIndex, content.length)
                )
            }
        }

        val result = mutableListOf<TxtChapterInfo>()
        var currentCharIndex = 0

        for (idx in matches.indices) {
            val (lineIdx, title) = matches[idx]
            val startIndex = getCharIndex(content, lines, lineIdx)

            if (idx == 0 && startIndex > 0) {
                result.add(TxtChapterInfo("前言", 0, startIndex))
            }

            val nextLineIdx = if (idx + 1 < matches.size) matches[idx + 1].first else lines.size
            val endIndex = getCharIndex(content, lines, nextLineIdx)

            result.add(TxtChapterInfo(title, startIndex, minOf(endIndex, content.length)))
            currentCharIndex = endIndex
        }

        // If there's trailing content after last chapter
        if (currentCharIndex < content.length) {
            // Extend last chapter to include remaining content
        }

        return result.ifEmpty { autoSplit(lines) }
    }

    private fun autoSplit(lines: List<String>): List<TxtChapterInfo> {
        val result = mutableListOf<TxtChapterInfo>()
        val content = lines.joinToString("\n")
        var currentIndex = 0
        val chunkLines = 300
        var chapterNum = 1

        for (i in lines.indices step chunkLines) {
            val endLine = minOf(i + chunkLines, lines.size)
            val endIndex = getCharIndex(content, lines, endLine)
            result.add(TxtChapterInfo("第${chapterNum}章", currentIndex, minOf(endIndex, content.length)))
            currentIndex = endIndex
            chapterNum++
        }
        return result
    }

    private fun getCharIndex(content: String, lines: List<String>, targetLine: Int): Int {
        if (targetLine <= 0) return 0
        if (targetLine >= lines.size) return content.length

        var charIndex = 0
        var currentLine = 0
        var pos = 0

        while (pos < content.length && currentLine < targetLine) {
            if (content[pos] == '\n') {
                currentLine++
                if (currentLine == targetLine) {
                    return pos + 1 // Position after the newline
                }
                charIndex = pos + 1
            }
            pos++
        }
        return if (currentLine >= targetLine) charIndex else content.length
    }
}
