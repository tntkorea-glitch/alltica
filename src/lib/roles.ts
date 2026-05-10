export const KBA_GRADES = ["KBA이사", "KBA지회장", "KBA지부장", "KBA정회원"] as const;
export type KbaGrade = (typeof KBA_GRADES)[number];

export const KBA_ROLES = KBA_GRADES; // backward-compat alias
export type KBARole = KbaGrade;

export type UserRole = "user" | "instructor" | "subadmin" | "admin";

export const ROLE_LABELS: Record<UserRole, string> = {
  user: "기본",
  instructor: "강사",
  subadmin: "서브관리자",
  admin: "관리자",
};
