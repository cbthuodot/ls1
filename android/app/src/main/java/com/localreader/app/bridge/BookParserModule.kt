package com.localreader.app.bridge

import com.facebook.react.bridge.*
import com.localreader.app.parser.*

class BookParserModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "BookParser"

    private val parsedBooks = mutableMapOf<String, Any>()

    @ReactMethod
    fun parseBook(uri: String, originalName: String, promise: Promise) {
        try {
            val filePath = uri.removePrefix("file://")
            val file = java.io.File(filePath)
            val ext = file.extension.lowercase()
            val bookId = filePath

            val displayName = if (originalName.isNotEmpty()) originalName else null

            when (ext) {
                "txt" -> {
                    val info = TxtBookParser.parse(filePath, displayName)
                    parsedBooks[bookId] = info
                    val result = Arguments.createMap().apply {
                        putString("id", bookId)
                        putString("type", "txt")
                        putString("title", info.title)
                        putString("author", info.author)
                        putString("format", "TXT")
                        putString("path", filePath)
                        putDouble("fileSize", info.fileSize.toDouble())
                        putString("charset", info.charset)
                        putInt("totalChapters", info.chapters.size)
                        putInt("totalChars", info.totalChars.toInt())
                        val chaptersArray = Arguments.createArray()
                        for ((idx, ch) in info.chapters.withIndex()) {
                            val chMap = Arguments.createMap()
                            chMap.putString("title", ch.title)
                            chMap.putInt("index", idx)
                            chMap.putInt("startIndex", ch.startIndex)
                            chMap.putInt("endIndex", ch.endIndex)
                            chaptersArray.pushMap(chMap)
                        }
                        putArray("chapters", chaptersArray)
                    }
                    promise.resolve(result)
                }
                "epub" -> {
                    val info = EpubBookParser.parse(filePath)
                    parsedBooks[bookId] = info
                    val result = Arguments.createMap().apply {
                        putString("id", bookId)
                        putString("type", "epub")
                        putString("title", info.title)
                        putString("author", info.author)
                        putString("format", "EPUB")
                        putString("path", filePath)
                        putDouble("fileSize", info.fileSize.toDouble())
                        putString("description", info.description)
                        putString("coverHref", info.coverHref)
                        putInt("totalChapters", info.chapters.size)
                        val chaptersArray = Arguments.createArray()
                        for (ch in info.chapters) {
                            val chMap = Arguments.createMap()
                            chMap.putString("title", ch.title)
                            chMap.putInt("index", ch.index)
                            chMap.putString("href", ch.href)
                            chaptersArray.pushMap(chMap)
                        }
                        putArray("chapters", chaptersArray)
                    }
                    promise.resolve(result)
                }
                else -> promise.reject("UNSUPPORTED", "Unsupported format: $ext")
            }
        } catch (e: Exception) {
            promise.reject("PARSE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun readChapter(filePath: String, chapterIndex: Int, promise: Promise) {
        try {
            val book = parsedBooks[filePath]
            when (book) {
                is TxtBookInfo -> {
                    val ch = book.chapters.getOrNull(chapterIndex)
                        ?: throw IndexOutOfBoundsException("Chapter not found")
                    // Use stored full content with correct encoding (already decoded)
                    val endIdx = ch.endIndex.coerceAtMost(book.fullContent.length)
                    promise.resolve(book.fullContent.substring(ch.startIndex, endIdx))
                }
                is EpubBookInfo -> {
                    val ch = book.chapters.getOrNull(chapterIndex)
                        ?: throw IndexOutOfBoundsException("Chapter not found")
                    promise.resolve(EpubBookParser.readChapter(filePath, ch.href))
                }
                null -> promise.reject("NOT_PARSED", "Book not parsed yet, call parseBook first")
                else -> promise.reject("UNKNOWN", "Unknown book type")
            }
        } catch (e: Exception) {
            promise.reject("READ_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getCoverPath(filePath: String, promise: Promise) {
        try {
            val book = parsedBooks[filePath]
            if (book is EpubBookInfo && book.coverHref != null) {
                val coverBytes = EpubBookParser.readCover(filePath, book.coverHref!!)
                if (coverBytes != null) {
                    val cacheDir = reactApplicationContext.cacheDir.resolve("covers")
                    cacheDir.mkdirs()
                    val coverFile = java.io.File(cacheDir, "${filePath.hashCode()}.jpg")
                    java.io.FileOutputStream(coverFile).use { it.write(coverBytes) }
                    promise.resolve(coverFile.absolutePath)
                    return
                }
            }
            promise.resolve(null)
        } catch (e: Exception) {
            promise.resolve(null)
        }
    }
}
