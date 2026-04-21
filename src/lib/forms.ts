import { FormTemplate } from "./types";

export const formTemplates: FormTemplate[] = [
  {
    slug: "product",
    title: "제품 구매 문의",
    description: "제품 구매 관련 문의를 남겨주시면 빠르게 안내드리겠습니다.",
    icon: "🛒",
    fields: [
      { name: "name", label: "이름", type: "text", required: true, placeholder: "홍길동" },
      { name: "company", label: "상호/회사명", type: "text", required: true, placeholder: "회사명을 입력하세요" },
      { name: "phone", label: "연락처", type: "tel", required: true, placeholder: "010-0000-0000" },
      { name: "address", label: "주소", type: "text", required: true, placeholder: "배송 받으실 주소" },
      { name: "email", label: "이메일", type: "email", required: true, placeholder: "example@email.com" },
      { name: "instagram", label: "인스타그램 아이디", type: "text", required: false, placeholder: "@instagram_id" },
      {
        name: "products",
        label: "관심 제품",
        type: "checkbox",
        required: true,
        options: ["스킨케어", "헤어케어", "바디케어", "메이크업", "건강식품", "기타"],
      },
      { name: "quantity", label: "예상 구매 수량", type: "number", required: false, placeholder: "예상 수량" },
      {
        name: "businessCard",
        label: "명함/사업자등록증",
        type: "file",
        required: false,
        accept: "image/*,.pdf",
      },
      { name: "message", label: "추가 문의사항", type: "textarea", required: false, placeholder: "추가 문의사항을 입력해주세요" },
    ],
  },
  {
    slug: "recruit",
    title: "인력 모집 지원",
    description: "함께 성장할 인재를 찾고 있습니다. 지금 바로 지원하세요.",
    icon: "👥",
    fields: [
      { name: "name", label: "이름", type: "text", required: true, placeholder: "홍길동" },
      { name: "phone", label: "연락처", type: "tel", required: true, placeholder: "010-0000-0000" },
      { name: "email", label: "이메일", type: "email", required: true, placeholder: "example@email.com" },
      { name: "birthdate", label: "생년월일", type: "date", required: true },
      {
        name: "field",
        label: "지원 분야",
        type: "select",
        required: true,
        options: ["영업", "마케팅", "교육강사", "물류", "기타"],
      },
      { name: "experience", label: "경력사항", type: "textarea", required: true, placeholder: "경력사항을 상세히 기재해주세요" },
      { name: "introduction", label: "자기소개", type: "textarea", required: true, placeholder: "자기소개를 작성해주세요" },
      {
        name: "resume",
        label: "이력서/포트폴리오",
        type: "file",
        required: false,
        accept: ".pdf,.doc,.docx,image/*",
      },
    ],
  },
  {
    slug: "partner",
    title: "대리점/파트너 신청",
    description: "대리점 및 파트너십 신청을 통해 함께 비즈니스를 성장시켜 보세요.",
    icon: "🤝",
    fields: [
      { name: "name", label: "이름", type: "text", required: true, placeholder: "홍길동" },
      { name: "company", label: "상호/회사명", type: "text", required: true, placeholder: "회사명을 입력하세요" },
      { name: "businessNumber", label: "사업자번호", type: "text", required: true, placeholder: "000-00-00000" },
      { name: "phone", label: "연락처", type: "tel", required: true, placeholder: "010-0000-0000" },
      { name: "email", label: "이메일", type: "email", required: true, placeholder: "example@email.com" },
      { name: "address", label: "주소", type: "text", required: true, placeholder: "사업장 주소" },
      {
        name: "businessType",
        label: "사업 형태",
        type: "select",
        required: true,
        options: ["개인사업자", "법인", "예비창업자"],
      },
      { name: "storeCount", label: "운영 중인 매장 수", type: "number", required: false, placeholder: "0" },
      { name: "interests", label: "관심 브랜드/제품", type: "text", required: false, placeholder: "관심 있는 브랜드나 제품을 입력하세요" },
      {
        name: "businessLicense",
        label: "사업자등록증",
        type: "file",
        required: false,
        accept: "image/*,.pdf",
      },
      { name: "message", label: "추가 메시지", type: "textarea", required: false, placeholder: "추가 메시지를 입력해주세요" },
    ],
  },
  {
    slug: "inquiry",
    title: "일반 문의",
    description: "제품, AS, 배송 등 궁금한 점이 있으시면 편하게 문의해주세요.",
    icon: "💬",
    fields: [
      { name: "name", label: "이름", type: "text", required: true, placeholder: "홍길동" },
      { name: "phone", label: "연락처", type: "tel", required: true, placeholder: "010-0000-0000" },
      { name: "email", label: "이메일", type: "email", required: true, placeholder: "example@email.com" },
      {
        name: "inquiryType",
        label: "문의 유형",
        type: "select",
        required: true,
        options: ["제품 문의", "AS", "배송", "기타"],
      },
      { name: "subject", label: "제목", type: "text", required: true, placeholder: "문의 제목을 입력하세요" },
      { name: "content", label: "문의 내용", type: "textarea", required: true, placeholder: "문의 내용을 상세히 작성해주세요" },
      {
        name: "attachment",
        label: "첨부파일",
        type: "file",
        required: false,
        accept: "image/*,.pdf,.doc,.docx,.zip",
      },
    ],
  },
];

export function getFormBySlug(slug: string): FormTemplate | undefined {
  return formTemplates.find((f) => f.slug === slug);
}
