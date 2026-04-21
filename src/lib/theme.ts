import { getSupabaseAdmin } from "./supabase";

export const THEMES = [
  { id: "navy", name: "네이비 클래식", preview: ["#0f1b2d", "#1e3a5f", "#2a5080"], hint: "기본 · 차분하고 신뢰감 있는" },
  { id: "peach", name: "피치 블룸", preview: ["#f472b6", "#ec4899", "#fbbf24"], hint: "화사하고 따뜻한 · 뷰티 브랜드 추천" },
  { id: "mint", name: "민트 프레시", preview: ["#34d399", "#10b981", "#06b6d4"], hint: "상쾌하고 자연스러운" },
  { id: "lavender", name: "라벤더 스카이", preview: ["#a78bfa", "#8b5cf6", "#ec4899"], hint: "부드럽고 감성적인" },
  { id: "sunset", name: "선셋 글로우", preview: ["#fb923c", "#f97316", "#f43f5e"], hint: "에너지 넘치는 · 브랜드 런칭에" },
  { id: "ocean", name: "오션 브리즈", preview: ["#38bdf8", "#0ea5e9", "#6366f1"], hint: "청량하고 전문적인" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export async function getCurrentTheme(): Promise<ThemeId> {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "theme")
      .maybeSingle();
    const value = data?.value as ThemeId | undefined;
    if (value && THEMES.some((t) => t.id === value)) return value;
  } catch (err) {
    console.error("[theme] getCurrentTheme 실패:", err);
  }
  return "navy";
}
