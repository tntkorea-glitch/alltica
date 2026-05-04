export type ServiceStatus = "live" | "coming-soon";
export type ServiceCategory = "sns" | "analytics" | "messaging" | "business";

export type Service = {
  brand: string;
  title: string;
  category: ServiceCategory;
  icon: string;
  url: string;
  status: ServiceStatus;
};

export const services: Service[] = [
  { brand: "Postica", title: "인스타 자동화", category: "sns", icon: "📸", url: "https://postica.co.kr", status: "live" },
  { brand: "Beautica", title: "뷰티샵 예약", category: "business", icon: "💇", url: "https://beautica.vercel.app", status: "live" },
  { brand: "Netica", title: "블로그 자동화", category: "sns", icon: "✍️", url: "https://netica.co.kr", status: "live" },
  { brand: "Yutica", title: "유튜브 자동화", category: "sns", icon: "▶️", url: "https://yutica.co.kr", status: "coming-soon" },
  { brand: "Liketica", title: "인스타 자동 좋아요", category: "sns", icon: "❤️", url: "https://liketica.vercel.app", status: "coming-soon" },
  { brand: "Datica", title: "데이터 분석", category: "analytics", icon: "📊", url: "https://datica.vercel.app", status: "coming-soon" },
  { brand: "Contica", title: "연락처 동기화", category: "messaging", icon: "📇", url: "https://contica.vercel.app", status: "coming-soon" },
  { brand: "Onetica", title: "원클릭 자동발송", category: "messaging", icon: "📤", url: "#", status: "coming-soon" },
  { brand: "Novtica", title: "사내 프로그램", category: "business", icon: "🏢", url: "#", status: "coming-soon" },
  { brand: "Infotica", title: "정보 서비스", category: "analytics", icon: "📰", url: "https://infotica.co.kr", status: "live" },
  { brand: "Maketica", title: "콘텐츠 제작", category: "business", icon: "🛠️", url: "https://maketica.co.kr", status: "live" },
];

export const categoryStyle: Record<
  ServiceCategory,
  { label: string; tag: string; gradient: string }
> = {
  sns: { label: "SNS 자동화", tag: "bg-blue-50 text-blue-600", gradient: "from-blue-500 to-indigo-500" },
  analytics: { label: "분석", tag: "bg-emerald-50 text-emerald-600", gradient: "from-emerald-500 to-teal-500" },
  messaging: { label: "메시징", tag: "bg-amber-50 text-amber-600", gradient: "from-amber-500 to-orange-500" },
  business: { label: "비즈니스", tag: "bg-rose-50 text-rose-600", gradient: "from-rose-500 to-pink-500" },
};
