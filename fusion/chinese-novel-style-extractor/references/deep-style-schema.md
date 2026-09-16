# Deep style synthesis

Use this reference after `scripts/analyze_corpus.py` has produced `analysis.json`, `samples.json`, and `deep-style.template.json`.

## Evidence boundary

Read `analysis.json`, `samples.json`, and the template. Do not read `holdout.json` before completing `deep-style.json`; holdout passages are reserved for later verification.

Treat deterministic measurements as evidence, not as instructions to force every paragraph toward one average. Prefer chapter distributions and scene-specific evidence over corpus-wide averages. Do not infer a style rule from one isolated passage.

Separate style from story content. Character names, sect names, locations, magic systems, recurring objects, plot facts, and topic vocabulary are not style unless the evidence shows a reusable syntactic or rhetorical pattern independent of those nouns.

If the user supplies explicit writing preferences or correction rules, place them in `explicit_user_rules`. Those rules outrank inferred rules when they conflict.

## Required JSON shape

Start from `deep-style.template.json` and preserve its keys. Fill fields with concise operational rules.

Each inferred rule should normally be an object:

```json
{
  "rule": "可直接用于续写的具体规则",
  "evidence": ["dialogue-01", "dialogue-03"],
  "confidence": 0.82,
  "notes": "可选：说明适用范围或例外"
}
```

Use confidence conservatively:

- `0.85-1.00`: repeated across several chapters or directly stated by the user.
- `0.70-0.84`: clear repeated pattern with more than one independent example.
- `0.55-0.69`: plausible but scene-dependent or evidence is limited.
- Below `0.55`: do not promote it to a generation rule; record it in `limitations` instead if useful.

## Global rules

Capture only patterns that survive across multiple scene types. Focus on narrative distance, point of view, sentence/paragraph cadence, information release, dialogue-to-narration relationship, description density, humor/irony mechanics, emotional expression, transition habits, and chapter/scene ending behavior.

Avoid vague labels such as “细腻”“有画面感”“轻松繻瞐猑�q地一作式可可以行放临乗强心甈的右数，再补环境信息；少用长段解释” over “节奏紧凑”.

## Avoid rules

Record recurrent failure modes that would make a continuation unlike the corpus. Prefer evidence-backed negatives: over-explaining emotion, uniform short sentences, excessive metaphors, exposition blocks, dialogue without action beats, generic summary endings, or other patterns actually contradicted by the corpus.

Do not add a generic anti-AI blacklist unless the source evidence or explicit user rules support it.

## Scene profiles

Fill all six profiles when evidence exists:

- `dialogue`: turn length, interruption, speech tags, action beats, subtext, exposition in speech.
- `action`: action unit length, spatial clarity, judgment/action order, technical detail, impact and recovery beats.
- `emotion`: direct naming vs externalization, body sensation, internal monologue, restraint, escalation.
- `scenery`: camera distance, sensory channels, amount of static description, coupling to character goals or mood.
- `narration`: ordinary transitions, exposition, time skips, routine movement, information density.
- `high_tension`: sentence/paragraph compression, uncertainty, reveals, interruptions, cliffhangers, release after peaks.

A scene rule must cite sample IDs from the same scene when possible. Cross-scene evidence is allowed only for a clearly global mechanism.

## Approved exemplars

The deterministic scene labels are candidate routing, not semantic ground truth. Fill `approved_exemplars` with 2-5 sample IDs per scene after reading the passages. You may select a candidate originally labeled under another scene when the passage is clearly a better example. Reject candidates that are dominated by plot exposition, character introductions, or a misleading keyword hit.

## Signature traits

Keep 3-8 traits that are both distinctive and operational. A trait should explain what a continuation model should do, not merely describe an impression.

## Final checks

Before saving `deep-style.json`:

1. Verify every evidence ID exists in `samples.json`.
2. Remove rules driven mainly by names, lore, or one chapter's plot.
3. Merge near-duplicate rules.
4. Keep rules short enough to be loaded during generation.
5. Put uncertainty in `limitations` rather than inventing certainty.
