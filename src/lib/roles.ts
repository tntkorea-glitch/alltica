export const KBA_ROLES = ["KBA이사", "KBA지회장", "KBA지부장", "KBA정회원"] as const;
export type KBARole = (typeof KBA_ROLES)[number];
export type UserRole = "user" | "instructor" | "subadmin" | "admin" | KBARole;

export const ROLE_LABELS: Record<UserRole, string> = {
  user: "기본",
  instructor: "강사",
  subadmin: "서브관리자",
  admin: "관리자",
  "KBA이사": "KBA이사",
  "KBA지회장": "KBA지회장",
  "KBA지부장": "KBA지부장",
  "KBA정회원": "KBA정회원",
};
