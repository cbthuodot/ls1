package com.localreader.app.parser

import org.jsoup.Jsoup
import java.io.File
import java.util.zip.ZipFile
import javax.xml.parsers.DocumentBuilderFactory

data class EpubChapterInfo(
    val title: String,
    val href: String,
    val index: Int
)

data class EpubBookInfo(
    val title: String,
    val author: String,
    val description: String,
    val coverHref: String?,
    val chapters: List<EpubChapterInfo>,
    val fileSize: Long
)

object EpubBookParser {

    fun parse(filePath: String): EpubBookInfo {
        val zip = ZipFile(File(filePath))
        return try {
            val opfPath = findOpfPath(zip)
            val opfBase = opfPath.substringBeforeLast("/").let { if (it == opfPath) "" else "$it/" }

            val opfDoc = parseXml(zip, opfPath)

            val title = extractText(opfDoc, "title") ?: File(filePath).nameWithoutExtension
            val author = extractText(opfDoc, "creator") ?: ""
            val description = extractText(opfDoc, "description") ?: ""

            val manifest = mutableMapOf<String, String>() // id -> href
            val items = opfDoc.getElementsByTagName("item")
            for (i in 0 until items.length) {
                val item = items.item(i)
                val id = item.attributes.getNamedItem("id")?.nodeValue ?: continue
                val href = item.attributes.getNamedItem("href")?.nodeValue ?: continue
                manifest[id] = href
            }

            val spineIds = mutableListOf<String>()
            val spineItems = opfDoc.getElementsByTagName("itemref")
            for (i in 0 until spineItems.length) {
                val idref = spineItems.item(i).attributes.getNamedItem("idref")?.nodeValue ?: continue
                spineIds.add(idref)
            }

            val coverHref = findCoverHref(opfDoc, manifest)

            val tocHref = findTocHref(opfDoc, manifest) ?: findNcxHref(manifest)
            val chapters = if (tocHref != null) {
                parseToc(zip, opfBase + tocHref, opfBase, spineIds, manifest)
            } else {
                spineIds.mapIndexed { idx, idref ->
                    val href = manifest[idref] ?: idref
                    EpubChapterInfo(title = "第${idx + 1}章", href = opfBase + href, index = idx)
                }
            }

            EpubBookInfo(
                title = title,
                author = author,
                description = description,
                coverHref = coverHref?.let { opfBase + it },
                chapters = chapters,
                fileSize = File(filePath).length()
            )
        } finally {
            zip.close()
        }
    }

    fun readChapter(filePath: String, href: String): String {
        val zip = ZipFile(File(filePath))
        return try {
            val entry = zip.getEntry(href) ?: throw IllegalStateException("Chapter not found: $href")
            val html = zip.getInputStream(entry).bufferedReader().readText()
            parseHtmlContent(html)
        } finally {
            zip.close()
        }
    }

    fun readCover(filePath: String, coverHref: String): ByteArray? {
        val zip = ZipFile(File(filePath))
        return try {
            val entry = zip.getEntry(coverHref) ?: return null
            zip.getInputStream(entry).readBytes()
        } finally {
            zip.close()
        }
    }

    private fun findOpfPath(zip: ZipFile): String {
        val containerEntry = zip.getEntry("META-INF/container.xml")
            ?: throw IllegalStateException("Invalid EPUB: missing container.xml")
        val containerXml = zip.getInputStream(containerEntry).bufferedReader().readText()
        val regex = Regex("""full-path="([^"]+)"""")
        return regex.find(containerXml)?.groupValues?.get(1)
            ?: throw IllegalStateException("Invalid EPUB: OPF path not found")
    }

    private fun parseXml(zip: ZipFile, path: String) =
        zip.getInputStream(zip.getEntry(path) ?: throw IllegalStateException("Missing: $path")).use {
            DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(it)
        }

    private fun extractText(doc: org.w3c.dom.Document, tagName: String): String? {
        val elements = doc.getElementsByTagNameNS("*", tagName)
        if (elements.length == 0) return null
        return elements.item(0).textContent?.trim()
    }

    private fun findCoverHref(opfDoc: org.w3c.dom.Document, manifest: Map<String, String>): String? {
        // Check meta cover
        val metas = opfDoc.getElementsByTagName("meta")
        for (i in 0 until metas.length) {
            val meta = metas.item(i)
            if (meta.attributes.getNamedItem("name")?.nodeValue == "cover") {
                val coverId = meta.attributes.getNamedItem("content")?.nodeValue
                if (coverId != null) return manifest[coverId]
            }
        }
        // Fallback: find item with id="cover" or properties="cover-image"
        val items = opfDoc.getElementsByTagName("item")
        for (i in 0 until items.length) {
            val item = items.item(i)
            val id = item.attributes.getNamedItem("id")?.nodeValue ?: continue
            val props = item.attributes.getNamedItem("properties")?.nodeValue ?: ""
            if (id.lowercase() == "cover" || props.contains("cover-image")) {
                return item.attributes.getNamedItem("href")?.nodeValue
            }
        }
        return null
    }

    private fun findTocHref(opfDoc: org.w3c.dom.Document, manifest: Map<String, String>): String? {
        // Check for nav.xhtml (EPUB3)
        val items = opfDoc.getElementsByTagName("item")
        for (i in 0 until items.length) {
            val item = items.item(i)
            val props = item.attributes.getNamedItem("properties")?.nodeValue ?: ""
            if (props.contains("nav")) {
                return item.attributes.getNamedItem("href")?.nodeValue
            }
        }
        // Check for toc id in spine
        val spine = opfDoc.getElementsByTagName("spine")
        if (spine.length > 0) {
            val tocId = spine.item(0).attributes.getNamedItem("toc")?.nodeValue
            if (tocId != null) return manifest[tocId]
        }
        return null
    }

    private fun findNcxHref(manifest: Map<String, String>): String? {
        for ((_, href) in manifest) {
            if (href.endsWith(".ncx")) return href
        }
        return null
    }

    private fun parseToc(
        zip: ZipFile,
        tocPath: String,
        opfBase: String,
        spineIds: List<String>,
        manifest: Map<String, String>
    ): List<EpubChapterInfo> {
        try {
            val entry = zip.getEntry(tocPath)
            if (entry == null) return spineChapters(spineIds, manifest, opfBase)

            val content = zip.getInputStream(entry).bufferedReader().readText()

            if (tocPath.endsWith(".ncx")) {
                return parseNcxToc(content, opfBase)
            } else {
                return parseNavToc(content)
            }
        } catch (_: Exception) {
            return spineChapters(spineIds, manifest, opfBase)
        }
    }

    private fun parseNcxToc(ncxContent: String, opfBase: String): List<EpubChapterInfo> {
        val doc = DocumentBuilderFactory.newInstance().newDocumentBuilder()
            .parse(ncxContent.byteInputStream())
        val navPoints = doc.getElementsByTagName("navPoint")
        val chapters = mutableListOf<EpubChapterInfo>()
        for (i in 0 until navPoints.length) {
            val np = navPoints.item(i)
            val titleEl = np.childNodes.let { nodes ->
                (0 until nodes.length).map { nodes.item(it) }.find { it.nodeName == "navLabel" }
                    ?.childNodes?.let { ns ->
                        (0 until ns.length).map { ns.item(it) }.find { it.nodeName == "text" }
                    }
            }
            val title = titleEl?.textContent?.trim() ?: "第${i + 1}章"
            val href = np.childNodes.let { nodes ->
                (0 until nodes.length).map { nodes.item(it) }.find { it.nodeName == "content" }
                    ?.attributes?.getNamedItem("src")?.nodeValue ?: ""
            }
            val resolvedHref = if (href.contains("://")) href else opfBase + href.split("#").first()
            chapters.add(EpubChapterInfo(title, resolvedHref, i))
        }
        return chapters.ifEmpty { emptyList() }
    }

    private fun parseNavToc(navHtml: String): List<EpubChapterInfo> {
        val doc = Jsoup.parse(navHtml)
        val links = doc.select("nav#toc a, nav[epub\\:type=toc] a, nav.toc a, ol a")
        return links.mapIndexed { idx, link ->
            EpubChapterInfo(
                title = link.text().trim(),
                href = link.attr("href").split("#").first(),
                index = idx
            )
        }
    }

    private fun spineChapters(
        spineIds: List<String>,
        manifest: Map<String, String>,
        opfBase: String
    ): List<EpubChapterInfo> {
        return spineIds.mapIndexed { idx, idref ->
            val href = manifest[idref] ?: idref
            EpubChapterInfo(title = "第${idx + 1}章", href = opfBase + href, index = idx)
        }
    }

    private fun parseHtmlContent(html: String): String {
        val doc = Jsoup.parse(html)
        // Remove scripts, styles, navigation elements
        doc.select("script, style, nav, head, .nav, .toc").remove()
        // Remove images (they won't render in text mode)
        doc.select("img, svg, video, audio, iframe").remove()
        // Get text content
        val rawText = doc.body()?.wholeText() ?: doc.wholeText()
        // Clean up: normalize whitespace
        return rawText
            .replace(Regex("""\r\n"""), "\n")
            .replace(Regex("""\n{3,}"""), "\n\n")
            .trim()
    }
}
