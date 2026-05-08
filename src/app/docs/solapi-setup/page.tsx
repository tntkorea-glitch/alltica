import Link from "next/link";

export const metadata = {
  title: "Solapi 알림톡 연동 설정 가이드 | Alltica",
};

function Step({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-5">
      <div className="shrink-0 w-8 h-8 rounded-full bg-brand text-white text-sm font-bold flex items-center justify-center mt-0.5">
        {num}
      </div>
      <div className="flex-1 pb-8 border-b border-gray-100 last:border-0">
        <h3 className="text-base font-bold text-gray-900 mb-3">{title}</h3>
        <div className="text-sm text-gray-600 leading-relaxed space-y-2">{children}</div>
      </div>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-gray-100 text-brand px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 leading-relaxed">
      {children}
    </div>
  );
}

function WarnBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 leading-relaxed">
      {children}
    </div>
  );
}

export default function SolapiSetupPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-24">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand mb-4 transition-colors">
            ← 관리자로 돌아가기
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">📱</span>
            <h1 className="text-2xl font-extrabold text-gray-900">Solapi 알림톡 연동 가이드</h1>
          </div>
          <p className="text-gray-500 text-sm">
            세미나 예약 확정·취소 시 신청자에게 카카오 알림톡을 자동 발송하기 위한 설정 안내입니다.
          </p>
        </div>

        {/* Overview */}
        <InfoBox>
          <strong>연동 흐름 요약</strong><br />
          Solapi 계정 생성 → API 키 발급 → 카카오 비즈니스 채널 연결 → 알림톡 템플릿 등록 및 심사 → Alltica 설정 입력
        </InfoBox>

        <div className="mt-8 bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 space-y-0">
          <Step num="1" title="Solapi 회원가입 및 계정 생성">
            <p>
              <a href="https://solapi.com" target="_blank" rel="noopener noreferrer" className="text-brand underline underline-offset-2">
                solapi.com
              </a>
              에 접속해 회원가입 후 로그인합니다.
            </p>
            <p>신규 가입 시 소량의 무료 크레딧이 제공됩니다. 실제 발송 전 잔액을 확인·충전하세요.</p>
          </Step>

          <Step num="2" title="API Key / API Secret 발급">
            <p>Solapi 콘솔 상단 우측 <strong>계정명 → API Keys</strong>로 이동합니다.</p>
            <p><strong>새 API 키 만들기</strong>를 클릭 후 생성된 값을 복사합니다.</p>
            <ul className="list-disc list-inside space-y-1 mt-2 pl-1">
              <li><strong>API Key</strong>: <Code>NCSXXXXXXXXXXXXXXXX</Code> 형식</li>
              <li><strong>API Secret</strong>: 최초 1회만 노출 — 반드시 즉시 복사해 보관</li>
            </ul>
            <WarnBox>
              API Secret은 페이지를 벗어나면 다시 확인할 수 없습니다. 생성 즉시 안전한 곳에 저장하세요.
            </WarnBox>
          </Step>

          <Step num="3" title="카카오 비즈니스 채널 연결 및 채널 ID(pfId) 확인">
            <p>Solapi 콘솔 → <strong>카카오 채널</strong> 메뉴로 이동합니다.</p>
            <p><strong>채널 추가</strong>를 클릭 후 카카오 비즈니스 채널 관리자 계정으로 로그인해 채널을 연결합니다.</p>
            <p>연결이 완료되면 채널 목록에서 <strong>프로필 ID (pfId)</strong> 값을 확인합니다.</p>
            <ul className="list-disc list-inside mt-2 pl-1">
              <li><Code>KA01PF...</Code> 형식으로 시작하는 문자열입니다.</li>
            </ul>
            <InfoBox>
              카카오 비즈니스 채널이 없다면 <a href="https://business.kakao.com" target="_blank" rel="noopener noreferrer" className="text-brand underline underline-offset-2">business.kakao.com</a>에서 먼저 채널을 개설해야 합니다.
            </InfoBox>
          </Step>

          <Step num="4" title="알림톡 템플릿 등록 및 심사 신청">
            <p>Solapi 콘솔 → <strong>알림톡 → 템플릿 관리</strong>로 이동합니다.</p>
            <p>아래 2개 템플릿을 등록하고 심사를 신청합니다.</p>

            <div className="space-y-4 mt-3">
              <div className="border border-gray-200 rounded-xl p-4">
                <p className="text-xs font-bold text-brand mb-2">템플릿 ① — 예약 확정</p>
                <p className="text-xs text-gray-500 mb-1">템플릿 코드 (자유 설정): <Code>CONFIRM_001</Code></p>
                <pre className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">{`[Alltica] 세미나 예약이 확정되었습니다.

• 세미나명: #{seminar_title}
• 일시: #{date}
• 장소: #{location}
• 강사: #{instructor}

문의: #{contact}`}</pre>
              </div>

              <div className="border border-gray-200 rounded-xl p-4">
                <p className="text-xs font-bold text-red-500 mb-2">템플릿 ② — 예약 취소</p>
                <p className="text-xs text-gray-500 mb-1">템플릿 코드 (자유 설정): <Code>CANCEL_001</Code></p>
                <pre className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">{`[Alltica] 세미나 예약이 취소되었습니다.

• 세미나명: #{seminar_title}
• 일시: #{date}

환불 등 문의: #{contact}`}</pre>
              </div>
            </div>

            <WarnBox>
              템플릿 심사는 영업일 기준 1~3일 소요됩니다. 심사 완료 후에야 실제 발송이 가능합니다.
            </WarnBox>
          </Step>

          <Step num="5" title="Alltica 설정에 값 입력">
            <p>관리자 페이지 → <strong>사용자</strong> 탭 → 해당 강사 행의 <strong>솔라피</strong> 버튼을 클릭합니다.</p>
            <ul className="list-disc list-inside space-y-1.5 mt-2 pl-1">
              <li><strong>API 선택</strong>: "강사 자체 Solapi 사용" 토글 ON</li>
              <li><strong>API Key</strong>: Step 2에서 발급한 값 입력</li>
              <li><strong>API Secret</strong>: Step 2에서 발급한 값 입력</li>
              <li><strong>발신번호</strong>: Solapi에 등록된 발신번호 (<Code>01012345678</Code> 형식)</li>
              <li><strong>카카오 채널 pfId</strong>: Step 3에서 확인한 <Code>KA01PF...</Code> 값</li>
            </ul>
            <p className="mt-2">입력 후 <strong>저장</strong>을 클릭합니다.</p>
          </Step>

          <Step num="6" title="환경변수에 템플릿 코드 등록">
            <p>Vercel 대시보드 → <strong>Settings → Environment Variables</strong>에서 아래 2개 변수를 추가합니다.</p>
            <div className="bg-gray-900 rounded-xl p-4 mt-2 space-y-1">
              <p className="text-xs font-mono text-green-400">SOLAPI_ALIMTALK_TEMPLATE_APPLICANT=<span className="text-white">CONFIRM_001</span></p>
              <p className="text-xs font-mono text-green-400">SOLAPI_ALIMTALK_TEMPLATE_ADMIN=<span className="text-white">CANCEL_001</span></p>
            </div>
            <p className="mt-2">값은 Step 4에서 직접 지정한 <strong>템플릿 코드</strong>와 일치해야 합니다.</p>
            <p>추가 후 Vercel <strong>Redeploy</strong>를 실행해야 반영됩니다.</p>
          </Step>
        </div>

        {/* Check */}
        <div className="mt-8 bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-4">✅ 연동 완료 체크리스트</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            {[
              "Solapi 계정 생성 완료",
              "API Key / Secret 발급 및 저장",
              "카카오 비즈니스 채널 Solapi 연결 완료",
              "알림톡 템플릿 2개 등록 및 심사 승인",
              "Alltica 관리자 → 사용자 → 솔라피 설정 저장",
              "Vercel 환경변수 2개 추가 후 Redeploy",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-gray-300 mt-0.5">☐</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          문의: <a href="mailto:tntkorea@tntkorea.co.kr" className="text-brand hover:underline">tntkorea@tntkorea.co.kr</a>
        </p>
      </div>
    </div>
  );
}
