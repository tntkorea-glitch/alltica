export interface ServiceFeature {
  icon: string;
  title: string;
  desc: string;
}

export interface SeminarHighlight {
  icon: string;
  title: string;
  desc: string;
}

export interface ServiceContent {
  key: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  features: ServiceFeature[];
  highlights: SeminarHighlight[];
  promoVideoUrl?: string;
}

const SERVICES: Record<string, ServiceContent> = {
  postica: {
    key: "postica",
    name: "Postica",
    tagline: "인스타그램 자동화 마케팅 솔루션",
    description: `포스티카(Postica)는 인스타그램 마케팅을 완전 자동화하는 스마트 솔루션입니다.

타겟 팔로워 자동 관리부터 게시물 좋아요·댓글 자동화까지, 하루 10분이면 인스타그램 마케팅 전체를 운영할 수 있습니다. 소상공인부터 브랜드 마케터까지, 복잡한 인스타그램 운영을 단순하게 만들어드립니다.`,
    url: "https://postica.co.kr",
    features: [
      { icon: "👥", title: "자동 팔로우 · 언팔로우", desc: "타겟 고객층을 정밀하게 자동으로 팔로우하고 관리" },
      { icon: "❤️", title: "자동 좋아요", desc: "관련 해시태그 게시물에 자동 좋아요로 노출 확대" },
      { icon: "💬", title: "자동 댓글", desc: "자연스러운 맞춤 댓글로 인게이지먼트 자동 생성" },
      { icon: "📊", title: "팔로워 분석", desc: "팔로워 증감 추이와 인게이지먼트 데이터 대시보드" },
      { icon: "⏰", title: "예약 게시", desc: "최적 시간대에 게시물을 자동으로 업로드 예약" },
      { icon: "🎯", title: "정밀 타겟 설정", desc: "경쟁사 팔로워·해시태그 기반 정밀 타겟 설정" },
    ],
    highlights: [
      { icon: "🚀", title: "포스티카 실전 셋업", desc: "계정 연동부터 첫 자동화 실행까지 당일 완성" },
      { icon: "📈", title: "팔로워 성장 공식", desc: "실제 데이터로 검증된 인스타 계정 성장 전략 공개" },
      { icon: "🤖", title: "자동화 시나리오 설계", desc: "나에게 맞는 워크플로우를 직접 설계하고 실습" },
      { icon: "💰", title: "마케팅 ROI 측정", desc: "팔로워·좋아요를 매출로 연결하는 지표 세팅법" },
    ],
    promoVideoUrl: "/videos/postica-promo-vertical.mp4",
  },
  yutica: {
    key: "yutica",
    name: "Yutica",
    tagline: "유튜브 자동화 마케팅 솔루션",
    description: `유티카(Yutica)는 유튜브 채널 성장을 자동화하는 마케팅 솔루션입니다.

구독자 분석, 댓글 자동 응답, 업로드 일정 관리까지 유튜브 운영 전반을 효율화합니다. 영상 하나 올리는 데 들어가는 반복 업무를 줄이고 콘텐츠 본질에 집중할 수 있게 도와드립니다.`,
    url: "https://yutica.co.kr",
    features: [
      { icon: "📺", title: "채널 성과 분석", desc: "구독자 성장 추이와 영상별 조회수 분석" },
      { icon: "💬", title: "댓글 자동 응답", desc: "키워드 기반 자동 댓글 응답 시스템" },
      { icon: "⏰", title: "예약 업로드", desc: "최적 시간대 자동 업로드 스케줄링" },
      { icon: "🎯", title: "경쟁 채널 분석", desc: "경쟁 채널 분석으로 성장 기회 발굴" },
    ],
    highlights: [
      { icon: "🚀", title: "유티카 실전 셋업", desc: "채널 연동부터 자동화 실행까지 당일 완성" },
      { icon: "📈", title: "구독자 성장 전략", desc: "검증된 유튜브 채널 성장 공식 공개" },
      { icon: "🤖", title: "자동화 워크플로우", desc: "나만의 자동화 시나리오 직접 설계" },
      { icon: "💰", title: "수익화 전략 연계", desc: "조회수·구독자를 수익으로 연결하는 방법" },
    ],
    promoVideoUrl: undefined,
  },
  netica: {
    key: "netica",
    name: "Netica",
    tagline: "블로그 자동화 마케팅 솔루션",
    description: `네티카(Netica)는 블로그 마케팅을 자동화하는 솔루션입니다.

포스팅 자동화, SEO 최적화, 트래픽 분석까지 블로그 운영 전반을 효율화합니다. 네이버·티스토리·워드프레스를 하나의 대시보드로 통합 관리하세요.`,
    url: "https://netica.co.kr",
    features: [
      { icon: "✍️", title: "자동 포스팅", desc: "키워드 기반 블로그 포스팅 자동 생성 및 업로드" },
      { icon: "🔍", title: "SEO 최적화", desc: "검색 상위 노출을 위한 자동 SEO 설정" },
      { icon: "📊", title: "트래픽 분석", desc: "방문자 분석 및 상위 노출 키워드 트래킹" },
      { icon: "🔗", title: "멀티채널 관리", desc: "네이버·티스토리·워드프레스 통합 관리" },
    ],
    highlights: [
      { icon: "🚀", title: "네티카 실전 셋업", desc: "블로그 연동부터 자동 포스팅까지 당일 완성" },
      { icon: "📈", title: "블로그 SEO 전략", desc: "검색 상위 노출을 위한 키워드 전략 공개" },
      { icon: "🤖", title: "자동화 포스팅 설계", desc: "자연스러운 자동 포스팅 템플릿 직접 설계" },
      { icon: "💰", title: "블로그 수익화 전략", desc: "트래픽을 매출로 연결하는 방법" },
    ],
    promoVideoUrl: undefined,
  },
  liketica: {
    key: "liketica",
    name: "Liketica",
    tagline: "인스타그램 자동 좋아요 솔루션",
    description: `라이크티카(Liketica)는 인스타그램 게시물에 자동으로 좋아요를 눌러주는 특화 솔루션입니다.

타겟 해시태그·계정 기반으로 관련 게시물을 자동 탐지하고 좋아요를 실행합니다. 계정 노출을 늘리고 팔로워를 자연스럽게 유입시킵니다.`,
    url: "https://liketica.vercel.app",
    features: [
      { icon: "❤️", title: "자동 좋아요", desc: "타겟 해시태그 게시물 자동 좋아요 실행" },
      { icon: "🎯", title: "정밀 타겟", desc: "경쟁사 팔로워 기반 정밀 타겟 설정" },
      { icon: "📊", title: "좋아요 분석", desc: "좋아요 이후 팔로워 유입 효과 분석" },
      { icon: "⚡", title: "속도 제어", desc: "인스타 정책에 맞는 안전한 속도 자동 조절" },
    ],
    highlights: [
      { icon: "🚀", title: "라이크티카 셋업", desc: "5분이면 자동 좋아요 세팅 완성" },
      { icon: "📈", title: "노출 확대 전략", desc: "좋아요로 계정 노출을 늘리는 실전 방법" },
      { icon: "🤖", title: "타겟 설정 실습", desc: "내 업종에 맞는 타겟 해시태그 발굴 실습" },
      { icon: "💰", title: "전환율 높이기", desc: "좋아요 → 팔로우 → 문의로 이어지는 퍼널 구성" },
    ],
    promoVideoUrl: undefined,
  },
  datica: {
    key: "datica",
    name: "Datica",
    tagline: "SNS 데이터 분석 솔루션",
    description: `다티카(Datica)는 SNS 마케팅 데이터를 분석하는 인사이트 솔루션입니다.

인스타그램·유튜브·블로그 채널의 성과 데이터를 통합 분석하고, 다음 마케팅 전략을 데이터 기반으로 수립할 수 있도록 도와드립니다.`,
    url: "https://datica.vercel.app",
    features: [
      { icon: "📊", title: "통합 분석", desc: "인스타·유튜브·블로그 데이터 한눈에" },
      { icon: "📈", title: "성장 트래킹", desc: "팔로워·구독자·방문자 성장 추이 분석" },
      { icon: "🔍", title: "인사이트 발굴", desc: "성과 높은 콘텐츠 패턴 자동 분석" },
      { icon: "📋", title: "자동 리포트", desc: "주간·월간 성과 리포트 자동 생성" },
    ],
    highlights: [
      { icon: "🚀", title: "다티카 셋업", desc: "채널 연동부터 대시보드 세팅까지 실습" },
      { icon: "📈", title: "데이터 읽는 법", desc: "숫자 뒤에 숨은 인사이트를 꺼내는 방법" },
      { icon: "🤖", title: "자동 리포트 설계", desc: "매주 자동으로 성과를 정리하는 리포트 세팅" },
      { icon: "💰", title: "데이터 기반 의사결정", desc: "감이 아닌 데이터로 마케팅 예산을 배분하는 방법" },
    ],
    promoVideoUrl: undefined,
  },
  contica: {
    key: "contica",
    name: "Contica",
    tagline: "연락처 동기화 & CRM 솔루션",
    description: `콘티카(Contica)는 고객 연락처를 자동으로 동기화하고 관리하는 CRM 솔루션입니다.

명함·카카오톡·인스타 DM에서 수집된 고객 정보를 하나의 주소록으로 통합하고, 맞춤형 메시지를 자동으로 발송합니다.`,
    url: "https://contica.vercel.app",
    features: [
      { icon: "📇", title: "연락처 자동 수집", desc: "명함 OCR·카카오·인스타 연락처 자동 통합" },
      { icon: "🔄", title: "멀티채널 동기화", desc: "여러 채널의 고객 데이터를 하나로 통합 관리" },
      { icon: "📨", title: "자동 메시지 발송", desc: "세그먼트별 맞춤 메시지 자동 발송" },
      { icon: "📊", title: "고객 분석", desc: "고객 행동 패턴 분석 및 우수 고객 식별" },
    ],
    highlights: [
      { icon: "🚀", title: "콘티카 셋업", desc: "연락처 연동부터 첫 자동 메시지까지 실습" },
      { icon: "📈", title: "고객 관리 전략", desc: "이탈 방지·재구매 유도를 위한 CRM 전략" },
      { icon: "🤖", title: "자동화 메시지 설계", desc: "고객 여정에 맞는 자동 메시지 시나리오 설계" },
      { icon: "💰", title: "재구매율 높이기", desc: "기존 고객을 재활성화하는 마케팅 자동화" },
    ],
    promoVideoUrl: undefined,
  },
  beautica: {
    key: "beautica",
    name: "Beautica",
    tagline: "뷰티샵 예약 관리 솔루션",
    description: `뷰티카(Beautica)는 뷰티샵·살롱 예약을 자동화하는 관리 솔루션입니다.

온라인 예약 접수부터 예약 확인 문자 자동 발송, 노쇼 방지 알림, 재방문 유도 메시지까지 뷰티샵 운영에 필요한 모든 것을 자동화합니다.`,
    url: "https://beautica.vercel.app",
    features: [
      { icon: "📅", title: "온라인 예약", desc: "24시간 온라인 예약 접수 및 자동 확인" },
      { icon: "📱", title: "자동 알림 문자", desc: "예약 확인·리마인더 문자 자동 발송" },
      { icon: "🚫", title: "노쇼 방지", desc: "예약 전날 자동 리마인드로 노쇼율 감소" },
      { icon: "🔄", title: "재방문 유도", desc: "방문 후 일정 기간 뒤 자동 재방문 유도 메시지" },
    ],
    highlights: [
      { icon: "🚀", title: "뷰티카 셋업", desc: "예약 페이지 개설부터 첫 예약 접수까지 실습" },
      { icon: "📈", title: "예약률 높이는 법", desc: "온라인 예약 전환율을 높이는 실전 전략" },
      { icon: "🤖", title: "자동 알림 설계", desc: "고객이 만족하는 알림 메시지 설계 실습" },
      { icon: "💰", title: "노쇼 제로 전략", desc: "노쇼를 줄이고 재방문율을 높이는 방법" },
    ],
    promoVideoUrl: undefined,
  },
};

export function getServiceKeyFromSlug(slug: string): string | null {
  const prefix = slug.split("-")[0].toLowerCase();
  return SERVICES[prefix] ? prefix : null;
}

export function getServiceContent(key: string): ServiceContent | null {
  return SERVICES[key] ?? null;
}
