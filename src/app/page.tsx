import FormCard from "@/components/FormCard";
import SeminarCard from "@/components/SeminarCard";
import { formTemplates } from "@/lib/forms";
import { getAllSeminars } from "@/lib/seminars";
import Link from "next/link";

export default async function Home() {
  const seminars = await getAllSeminars();
  return (
    <div>
      {/* Hero - Full screen */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-deep via-brand to-[#1a365d] animate-gradient" />

        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-3xl" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px"
          }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center pt-20 pb-28">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-5 py-2 mb-8 animate-fade-in-up">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-white/80 font-medium">신청 접수 중</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight mb-6 animate-fade-in-up delay-100">
            모든 신청,{" "}
            <span className="bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
              한 곳에서
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-blue-100/80 max-w-2xl mx-auto leading-relaxed mb-10 animate-fade-in-up delay-200">
            세미나 교육, 제품 구매, 인재 모집, 파트너 신청까지
            <br className="hidden sm:block" />
            필요한 모든 신청을 빠르고 간편하게 접수하세요
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300">
            <Link
              href="/seminars"
              className="w-full sm:w-auto px-8 py-4 bg-white text-brand font-bold rounded-2xl text-base hover:bg-blue-50 transition-all shadow-xl shadow-black/10 hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.98]"
            >
              🎓 세미나 신청하기
            </Link>
            <a
              href="#forms"
              className="w-full sm:w-auto px-8 py-4 bg-white/10 text-white font-bold rounded-2xl text-base border border-white/20 hover:bg-white/20 transition-all backdrop-blur-sm hover:-translate-y-0.5 active:scale-[0.98]"
            >
              전체 신청서 보기
            </a>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 sm:gap-16 mt-16 animate-fade-in-up delay-400">
            {[
              { num: "5+", label: "신청서 유형" },
              { num: "24h", label: "빠른 응답" },
              { num: "100%", label: "안전한 관리" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-extrabold text-white">{stat.num}</div>
                <div className="text-xs sm:text-sm text-blue-200/60 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
          <a href="#forms" className="flex flex-col items-center gap-2 text-white/40 hover:text-white/60 transition-colors">
            <span className="text-xs font-medium">아래로 스크롤</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </a>
        </div>
      </section>

      {/* Seminars section */}
      <section id="seminars-preview" className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-24">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="inline-block text-sm font-bold text-brand bg-blue-50 px-4 py-1.5 rounded-full mb-4">
              SEMINAR
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">
              진행 중인 세미나
            </h2>
            <p className="text-gray-500 text-sm sm:text-base">
              명함 업로드로 1분이면 신청 완료
            </p>
          </div>
          <Link
            href="/seminars"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
          >
            전체 보기 →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {seminars
            .filter((s) => s.status === "open" || s.status === "upcoming")
            .slice(0, 3)
            .map((s) => (
              <SeminarCard key={s.slug} seminar={s} />
            ))}
        </div>

        <div className="text-center mt-8 sm:hidden">
          <Link
            href="/seminars"
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand"
          >
            전체 세미나 보기 →
          </Link>
        </div>
      </section>

      {/* Form Cards Grid */}
      <section id="forms" className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <div className="text-center mb-14">
          <span className="inline-block text-sm font-bold text-brand bg-blue-50 px-4 py-1.5 rounded-full mb-4">
            APPLICATION
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
            신청 유형을 선택하세요
          </h2>
          <p className="text-gray-500 max-w-lg mx-auto">
            원하시는 신청 유형을 클릭하면 신청서 작성 페이지로 이동합니다
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {formTemplates.map((form, i) => (
            <FormCard key={form.slug} form={form} index={i} />
          ))}
        </div>
      </section>

      {/* Process Section */}
      <section className="bg-gray-50 py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-sm font-bold text-brand bg-blue-50 px-4 py-1.5 rounded-full mb-4">
              PROCESS
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
              간편한 3단계 신청
            </h2>
            <p className="text-gray-500">복잡한 과정 없이 빠르게 신청할 수 있습니다</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connection line (desktop) */}
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200" />

            {[
              {
                step: "01",
                icon: "📋",
                title: "신청서 선택",
                desc: "필요한 신청 유형을 선택하고 클릭합니다",
                color: "from-blue-500 to-indigo-500",
              },
              {
                step: "02",
                icon: "✏️",
                title: "정보 입력",
                desc: "필요한 정보를 빠르게 입력하고 제출합니다",
                color: "from-indigo-500 to-purple-500",
              },
              {
                step: "03",
                icon: "✅",
                title: "확인 & 연락",
                desc: "담당자가 확인 후 빠르게 연락드립니다",
                color: "from-purple-500 to-pink-500",
              },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className={`w-16 h-16 mx-auto bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center text-2xl shadow-lg mb-5 relative z-10`}>
                  {item.icon}
                </div>
                <div className="text-xs font-bold text-gray-400 mb-2">STEP {item.step}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust / Features Section */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-sm font-bold text-brand bg-blue-50 px-4 py-1.5 rounded-full mb-4">
              WHY US
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
              왜 Alltica 인가요?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: "빠른 접수",
                desc: "복잡한 과정 없이 몇 분 안에 신청을 완료할 수 있습니다",
                color: "bg-amber-50 text-amber-600",
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: "안전한 관리",
                desc: "개인정보는 안전하게 암호화되어 보관됩니다",
                color: "bg-green-50 text-green-600",
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                ),
                title: "통합 관리",
                desc: "여러 곳에 흩어진 신청을 한 곳에서 통합 관리합니다",
                color: "bg-blue-50 text-blue-600",
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                ),
                title: "신속한 응답",
                desc: "접수 후 담당자가 빠르게 확인하고 연락드립니다",
                color: "bg-violet-50 text-violet-600",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {item.icon}
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand via-brand to-brand-light" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-20 sm:py-24 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-4">
            지금 바로 신청하세요
          </h2>
          <p className="text-blue-100/70 mb-8 max-w-lg mx-auto">
            궁금한 점이 있으시면 카카오톡 또는 전화로 편하게 문의해주세요
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#forms"
              className="w-full sm:w-auto px-8 py-4 bg-white text-brand font-bold rounded-2xl text-base hover:bg-blue-50 transition-all shadow-xl hover:-translate-y-0.5"
            >
              신청서 작성하기
            </a>
            <a
              href="tel:010-8842-5659"
              className="w-full sm:w-auto px-8 py-4 bg-[#FEE500] text-[#3C1E1E] font-bold rounded-2xl text-base hover:bg-[#F5DC00] transition-all shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.89 5.29 4.71 6.71-.21.78-.77 2.83-.88 3.27-.14.55.2.54.42.39.17-.12 2.71-1.84 3.81-2.58.62.09 1.26.14 1.94.14 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
              </svg>
              카카오톡 상담
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
