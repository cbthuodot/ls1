# Upstream provenance and licensing

The fused implementation was developed after reviewing five upstream projects at fixed revisions. The final extractor is not a source-code merge of all five; license-compatible code/data is adapted with notice, while restricted implementations are reimplemented independently from published algorithms and observed behavior.

## Mowen

Repository: `jnoecker/mowen`
Revision reviewed: `f14917c497f23dbb3838b18d4a9c0e7c1332a046`
License: MIT.

Used directly/adapted: the idea of modular event extraction and culling, Burrows' Delta mechanics, Chinese tokenization/function-word support, and the Chinese function-word list in `core/src/mowen/data/function_words/chinese.txt`. The fused code is simplified for single-author long-form fiction and does not vendor the Mowen package.

MIT notice for the adapted material:

Copyright (c) 2026 John Noecker Jr.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## write-like-me

Repository: `Hiro-Inagawa/write-like-me`
Revision reviewed: `82797dd9239e5804654eaa26583aadd70f51221e`
License: MIT.

Concepts adapted: explicit-rule priority, generative vs corrective rules, exemplar typicality/diversity, holdout verification, and deterministic BLOCK/REVIEW style checks. No source file from this project is vendored in the fused skill.

## stylometric-transfer

Repository: `ngpepin/stylometric-transfer`
Revision reviewed: `74dd7e523e760f0607d46e8662b775b968a01057`
License: PolyForm Noncommercial 1.0.0.

Studied: corpus cleanup, fiction-aware quote handling, explicit measurement/target separation, rolling variability baselines, topic/proper-name leakage controls, compliance/deviation feedback, and short-text reliability ideas.

No source code from this project is copied into the fused implementation. Relevant mechanisms are independently reimplemented for Chinese fiction so the fused skill is not constrained by the upstream noncommercial license.

## stylo

Repository: `computationalstylistics/stylo`
Revision reviewed: `856f5f469ee808d367e5fcb31b938d30f37863dd`
License: GPL-3-or-later.

Studied: Hoover-style feature culling, Burrows' Delta, Eder's Delta, and classical stylometric workflow choices. No GPL source code is copied into the fused implementation; the mathematical methods are independently implemented.

## writing-style-extractor

Repository: `shannhk/writing-style-extractor`
Revision reviewed: `a6b3ba0138cab32efc937b6f4491f49a23f750cc`
README license statement: MIT.

Concepts adapted: layered qualitative style reporting, evidence-backed findings, confidence values, and replication-oriented rules. The fused schema narrows these ideas to Chinese fiction and avoids unsupported psychological claims.
