import FormCard from "@/components/FormCard";
import { formTemplates } from "@/lib/forms";

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1e3a5f] via-[#1e3a5f] to-[#2a5080] text-white py-20 sm:py-28 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
            모든 신청, 한 곳에서
          </h1>
          <p className="text-base sm:text-lg text-blue-100 max-w-2xl mx-auto leading-relaxed">
            세미나 교육, 제품 구매, 인력 모집, 파트너 신청, 일반 문의까지<br className="hidden sm:block" />
            필요한 신청을 빠르고 간편하게 접수하세요.
          </p>
        </div>
      </section>

      {/* Form Cards Grid */}
      <section className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-2">
          신청 유형을 선택하세요
        </h2>
        <p className="text-sm text-gray-500 text-center mb-10">
          원하시는 신청 유형을 클릭하면 신청서 작성 페이지로 이동합니다.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {formTemplates.map((form) => (
            <FormCard key={form.slug} form={form} />
          ))}
        </div>
      </section>

      {/* Info Section */}
      <section className="bg-white py-12 sm:py-16 px-4 border-t border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-6">이용 안내</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm">
            <div>
              <div className="text-3xl mb-3">📝</div>
              <h3 className="font-bold text-gray-900 mb-1">간편한 신청</h3>
              <p className="text-gray-500">필요한 정보만 입력하여 빠르게 신청할 수 있습니다.</p>
            </div>
            <div>
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="font-bold text-gray-900 mb-1">빠른 응답</h3>
              <p className="text-gray-500">접수 후 담당자가 신속하게 확인하고 연락드립니다.</p>
            </div>
            <div>
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="font-bold text-gray-900 mb-1">안전한 관리</h3>
              <p className="text-gray-500">제출하신 정보는 안전하게 보관 및 관리됩니다.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
