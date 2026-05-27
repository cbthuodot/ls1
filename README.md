# 本地阅读器 (Local Reader)

基于 Legado 解析算法 + React Native 精美 UI 的纯本地离线阅读器。无联网、无注册、无广告。

---

## 功能

| 功能 | 说明 |
|------|------|
| 格式支持 | TXT（智能编码检测 + 章节分割）、EPUB |
| 书架管理 | 网格/列表视图、格式筛选、排序、搜索 |
| 阅读器 | 滚动/翻页模式、字号/行距/边距/字体调节 |
| 主题 | 极简留白 / 纸感阅读 / 深色专注 |
| 目录 | 章节跳转、书签管理 |

---

## 技术栈

| 层 | 技术 |
|----|------|
| UI | React Native 0.81 + Expo SDK 54 |
| 路由 | Expo Router |
| 状态 | Zustand 5 |
| 图标 | Lucide React Native |
| 编码检测 | ICU4J (IBM) |
| HTML 解析 | Jsoup |
| 原生桥接 | React Native Native Module (Kotlin) |

---

## 项目结构

```
├── src/app/          # Expo Router 页面（书架、阅读器、导入、搜索、设置）
├── src/store/        # Zustand 状态管理
├── src/bridge/       # Native Module TypeScript 桥接
├── src/components/   # UI 组件
│
├── android/.../parser/     # Kotlin 解析引擎 (TXT/EPUB)
├── android/.../bridge/     # React Native Native Module
│
├── patches/          # Expo SDK 补丁
├── polyfills/        # 平台垫片
└── __create/         # 错误边界等基础设施
```

---

## 构建

### 环境

- Node.js 18+、Java 17 (Temurin)、Android SDK 36 (含 NDK)

### 步骤

```bash
# 1. 安装依赖
npm install

# 2. 生成原生代码（如果 android/ 目录已存在可跳过）
npx expo prebuild --platform android

# 3. 构建 Release APK
cd android && ./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

### WiFi 安装到手机

```bash
# 手机: 设置 → 开发者选项 → 无线调试 → 使用配对码配对
adb pair <IP>:<端口> <6位配对码>
adb install android/app/build/outputs/apk/release/app-release.apk
```

---

## 核心解析器

### TXT (`TxtBookParser.kt`)

编码检测流程：BOM 头 → ICU4J 多候选 → CJK 字符占比启发式 → GBK/UTF-8 回退

章节分割：12 种正则模式（"第X章"、"Chapter"、"楔子"等）+ 自动分章

### EPUB (`EpubBookParser.kt`)

ZIP → `container.xml` → OPF → 元数据 + 目录（NCX/nav）+ Jsoup HTML 转纯文本

---

## License

MIT
