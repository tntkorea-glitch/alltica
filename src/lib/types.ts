export type FieldType =
  | "text"
  | "tel"
  | "email"
  | "textarea"
  | "select"
  | "checkbox"
  | "date"
  | "number"
  | "file";

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
  accept?: string;
}

export interface FormTemplate {
  slug: string;
  title: string;
  description: string;
  icon: string;
  fields: FormField[];
}

export interface Submission {
  id: string;
  formSlug: string;
  formTitle: string;
  data: Record<string, string | string[]>;
  files: Record<string, string>;
  submittedAt: string;
}
