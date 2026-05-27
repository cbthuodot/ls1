/**
 * GlassCard — True iOS 26 Liquid Glass quality
 *
 * Technique:
 *   1. Outer clip view: borderRadius + shadow glow
 *   2. LinearGradient rim (bright top-left → transparent bottom-right) fills the outer 1px "border"
 *   3. Inner view (1px inset) with BlurView — the actual frosted material
 *   4. CardFill: near-invisible tinted overlay on the blur
 *   5. Specular: linear gradient fade over top area (light washing across glass surface)
 *
 * Usage:
 *   <GlassCard glassBg={GLASS_BG.minimal} style={{ width: 160, height: 220 }}>
 *     <Text>content</Text>
 *   </GlassCard>
 */
import { View } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

export default function GlassCard({
  glassBg,
  borderRadius = 20,
  style,
  contentStyle,
  children,
}) {
  const r = borderRadius;
  return (
    <View
      style={[
        {
          borderRadius: r,
          overflow: "hidden",
          // Accent-tinted glow shadow — the key to glass depth
          shadowColor: glassBg.accentColor,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.25,
          shadowRadius: 22,
          elevation: 12,
        },
        style,
      ]}
    >
      {/* ─── Rim light: gradient "halo" as the border ─── */}
      <LinearGradient
        colors={[glassBg.rimTop, glassBg.rimMid, glassBg.rimBottom]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.65, y: 1 }}
        style={{ position: "absolute", inset: 0, borderRadius: r }}
      />

      {/* ─── Inner glass panel, 1px inset from the rim ─── */}
      <View
        style={{ margin: 1, borderRadius: r - 1, overflow: "hidden", flex: 1 }}
      >
        <BlurView
          intensity={glassBg.blurIntensity}
          tint={glassBg.tint}
          style={{ flex: 1 }}
        >
          {/* Subtle tinted fill on top of blur */}
          <View
            style={[
              { flex: 1, backgroundColor: glassBg.cardFill },
              contentStyle,
            ]}
          >
            {/* Top specular shine — gradient from bright → transparent */}
            <LinearGradient
              colors={[glassBg.specularColor, "transparent"]}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: glassBg.specularHeight,
                borderTopLeftRadius: r - 1,
                borderTopRightRadius: r - 1,
                zIndex: 1,
                pointerEvents: "none",
              }}
            />
            {children}
          </View>
        </BlurView>
      </View>
    </View>
  );
}
