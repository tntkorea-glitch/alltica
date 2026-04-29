type Status = "live" | "coming-soon";
type Category = "sns" | "analytics" | "messaging" | "business";

type Service = {
  brand: string;
  title: string;
  category: Category;
  icon: string;
  url: string;
  status: Status;
};

const services: Service[] = [
  { brand: "Postica", title: "인스타 자동화", category: "sns", icon: "📸", url: "https://postica.co.kr", status: "live" },
  { brand: "Yutica", title: "유튜브 자동화", category: "sns", icon: "▶️", url: "https://yutica.co.kr", status: "live" },
  { brand: "Netica", title: "블로그 자동화", category: "sns", icon: "✍️", url: "https://netica.co.kr", status: "live" },
  { brand: "Liketica", title: "인스타 자동 좋아요", category: "sns", icon: "❤️", url: "https://liketica.vercel.app", status: "live" },
  { brand: "Datica", title: "데이터 분석", category: "analytics", icon: "📊", url: "https://datica.vercel.app", status: "live" },
  { brand: "Contica", title: "연락처 동기화", category: "messaging", icon: "📇", url: "https://contica.vercel.app", status: "live" },
  { brand: "Onetica", title: "원클릭 자동발송", category: "messaging", icon: "📤", url: "#", status: "coming-soon" },
  { brand: "Beautica", title: "뷰티샵 예약", category: "business", icon: "💇", url: "https://beautica.vercel.app", status: "live" },
  { brand: "Novtica", title: "사내 프로그램", category: "business", icon: "🏢", url: "#", status: "coming-soon" },
];

const categoryStyle: Record<Category, { label: string; tag: string; gradient: string }> = {
  sns: { label: "SNS 자동화", tag: "bg-blue-50 text-blue-600", gradient: "from-blue-500 to-indigo-500" },
  analytics: { label: "분석", tag: "bg-emerald-50 text-emerald-600", gradient: "from-emerald-500 to-teal-500" },
  messaging: { label: "메시징", tag: "bg-amber-50 text-amber-600", gradient: "from-amber-500 to-orange-500" },
  business: { label: "비즈니스", tag: "bg-rose-50 text-rose-600", gradient: "from-rose-500 to-pink-500" },
};

export default function ServiceLineup() {
  return (
    <section id="services" className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-24">
      <div className="text-center mb-14">
        <span className="inline-block text-sm font-bold text-brand bg-blue-50 px-4 py-1.5 rounded-full mb-4">
          ECOSYSTEM
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
          알티카 서비스 라인업
        </h2>
        <p className="text-gray-500 max-w-xl mx-auto">
          하나의 통합 플랫폼, 9개의 전문 서비스.
          <br className="hidden sm:block" />
          필요한 솔루션을 클릭해 바로 시작하세요.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {services.map((s) => {
          const cat = categoryStyle[s.category];
          const isLive = s.status === "live";

          const inner = (
            <div
              className={`relative h-full bg-white rounded-2xl border border-gray-100 p-6 transition-all duration-300 ${
                isLive
                  ? "group-hover:shadow-xl group-hover:-translate-y-1 group-hover:border-gray-200"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between mb-5">
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-2xl shadow-md transition-transform duration-300 ${
                    isLive ? "group-hover:scale-110" : ""
                  }`}
                >
                  {s.icon}
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cat.tag}`}>
                  {cat.label}
                </span>
              </div>

              <h3 className="text-xl font-extrabold text-gray-900 tracking-tight mb-1">
                {s.brand}
              </h3>
              <p className="text-sm text-gray-500 mb-5">{s.title}</p>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                {isLive ? (
                  <>
                    <span className="text-sm font-semibold text-brand">방문하기</span>
                    <span className="text-brand transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </>
                ) : (
                  <span className="text-xs font-semibold text-gray-400">🚧 준비 중</span>
                )}
              </div>
            </div>
          );

          if (!isLive) {
            return (
              <div
                key={s.brand}
                aria-disabled
                className="group cursor-not-allowed opacity-70"
              >
                {inner}
              </div>
            );
          }

          return (
            <a
              key={s.brand}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              {inner}
            </a>
          );
        })}
      </div>
    </section>
  );
}
