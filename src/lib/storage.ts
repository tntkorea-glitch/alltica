import fs from "fs";
import path from "path";
import { Submission } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const SUBMISSIONS_FILE = path.join(DATA_DIR, "submissions.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(SUBMISSIONS_FILE)) {
    fs.writeFileSync(SUBMISSIONS_FILE, "[]", "utf-8");
  }
}

export function getSubmissions(): Submission[] {
  ensureDataDir();
  const raw = fs.readFileSync(SUBMISSIONS_FILE, "utf-8");
  return JSON.parse(raw) as Submission[];
}

export function addSubmission(submission: Submission): void {
  const submissions = getSubmissions();
  submissions.unshift(submission);
  fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2), "utf-8");
}

export function saveUploadedFile(buffer: Buffer, originalName: string): string {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const timestamp = Date.now();
  const safeName = originalName.replace(/[^a-zA-Z0-9가-힣._-]/g, "_");
  const fileName = `${timestamp}_${safeName}`;
  const filePath = path.join(uploadsDir, fileName);
  fs.writeFileSync(filePath, buffer);
  return `/uploads/${fileName}`;
}
