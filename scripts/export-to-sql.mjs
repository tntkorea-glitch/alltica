/**
 * 구 Supabase에서 데이터 읽어 SQL INSERT 파일 생성
 * 실행: node scripts/export-to-sql.mjs
 * 생성된 supabase/data-export.sql 을 신 프로젝트 SQL Editor에서 실행
 */

import { writeFileSync } from 'fs'

// 실행 전 환경변수 설정:
// OLD_SUPABASE_URL, OLD_SUPABASE_KEY — 구 프로젝트 service_role 키
const OLD_URL = process.env.OLD_SUPABASE_URL
const OLD_KEY = process.env.OLD_SUPABASE_KEY
if (!OLD_URL || !OLD_KEY) {
  console.error('필수 환경변수 누락: OLD_SUPABASE_URL, OLD_SUPABASE_KEY')
  process.exit(1)
}

const TABLES = ['app_settings', 'users', 'seminars', 'applications', 'submissions']

function escape(v) {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE'
  if (typeof v === 'number') return String(v)
  if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`
  return `'${String(v).replace(/'/g, "''")}'`
}

async function fetchAll(table) {
  const res = await fetch(`${OLD_URL}/rest/v1/${table}?select=*&limit=10000&order=created_at.asc`, {
    headers: { apikey: OLD_KEY, Authorization: `Bearer ${OLD_KEY}` },
  })
  if (res.status === 404) return null  // 테이블 없음
  if (!res.ok) {
    // created_at 없는 테이블 재시도
    const res2 = await fetch(`${OLD_URL}/rest/v1/${table}?select=*&limit=10000`, {
      headers: { apikey: OLD_KEY, Authorization: `Bearer ${OLD_KEY}` },
    })
    if (res2.status === 404) return null
    if (!res2.ok) throw new Error(`${table}: ${res2.status}`)
    return res2.json()
  }
  return res.json()
}

function rowsToSql(table, rows) {
  if (!rows.length) return `-- ${table}: 데이터 없음\n`
  const cols = Object.keys(rows[0])
  const lines = rows.map(row => {
    const vals = cols.map(c => escape(row[c])).join(', ')
    return `  (${vals})`
  })
  return [
    `-- ${table} (${rows.length}건)`,
    `INSERT INTO public.${table} (${cols.map(c => `"${c}"`).join(', ')})`,
    `VALUES`,
    lines.join(',\n'),
    `ON CONFLICT DO NOTHING;\n`,
  ].join('\n')
}

async function main() {
  console.log('구 Supabase에서 데이터 읽는 중...')
  const parts = [
    `-- alltica 데이터 이관 SQL`,
    `-- 신 Supabase SQL Editor에서 실행`,
    `-- 생성: ${new Date().toISOString()}\n`,
    `SET session_replication_role = replica; -- FK 검사 일시 비활성\n`,
  ]

  for (const table of TABLES) {
    process.stdout.write(`  ${table}... `)
    const rows = await fetchAll(table)
    if (rows === null) { console.log('테이블 없음 — 스킵'); continue }
    console.log(`${rows.length}건`)
    parts.push(rowsToSql(table, rows))
  }

  parts.push(`SET session_replication_role = DEFAULT;\n`)

  const sql = parts.join('\n')
  writeFileSync('supabase/data-export.sql', sql, 'utf8')
  console.log('\n✅ supabase/data-export.sql 생성 완료')
  console.log('→ 신 Supabase SQL Editor에서 이 파일 내용을 실행하세요.')
}

main().catch(e => { console.error('❌', e.message); process.exit(1) })
