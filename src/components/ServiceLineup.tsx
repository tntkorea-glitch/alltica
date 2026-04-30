import { services, categoryStyle } from "@/lib/services";
import { isAdminContext } from "@/lib/admin-context";

export default async function ServiceLineup() {
  const isAdmin = await isAdminContext();

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
          const effectiveLive = s.status === "live" && isAdmin;

          const inner = (
            <div
              className={`relative h-full bg-white rounded-2xl border border-gray-100 p-6 transition-all duration-300 ${
                effectiveLive
                  ? "group-hover:shadow-xl group-hover:-translate-y-1 group-hover:border-gray-200"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between mb-5">
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-2xl shadow-md transition-transform duration-300 ${
                    effectiveLive ? "group-hover:scale-110" : ""
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
                {effectiveLive ? (
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

          if (!effectiveLive) {
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
