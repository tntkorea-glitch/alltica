/**
 * Supabase 데이터 마이그레이션: 구 프로젝트 → 신 프로젝트
 * 실행: node scripts/migrate-supabase.mjs
 *
 * 순서: schema.sql 먼저 신 프로젝트에 실행 완료 후 이 스크립트 실행
 */

// 실행 전 환경변수 설정:
// OLD_SUPABASE_URL / OLD_SUPABASE_KEY — 구 프로젝트
// NEW_SUPABASE_URL / NEW_SUPABASE_KEY — 신 프로젝트 (없으면 .env.local 값 사용)
const OLD_URL = process.env.OLD_SUPABASE_URL
const OLD_KEY = process.env.OLD_SUPABASE_KEY
const NEW_URL = process.env.NEW_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const NEW_KEY = process.env.NEW_SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
if (!OLD_URL || !OLD_KEY || !NEW_URL || !NEW_KEY) {
  console.error('필수 환경변수 누락: OLD_SUPABASE_URL, OLD_SUPABASE_KEY, NEW_SUPABASE_URL(또는 .env), NEW_SUPABASE_KEY(또는 .env)')
  process.exit(1)
}

// FK 의존성 순서 (부모 테이블 먼저)
const TABLES = ['app_settings', 'users', 'seminars', 'applications', 'submissions']

async function readAll(url, key, table) {
  const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=10000`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) throw new Error(`READ ${table}: ${res.status} ${await res.text()}`)
  return res.json()
}

async function insertAll(url, key, table, rows) {
  if (rows.length === 0) {
    console.log(`  ${table}: 데이터 없음, 스킵`)
    return
  }
  const res = await fetch(`${url}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(rows),
  })
  if (!res.ok) throw new Error(`INSERT ${table}: ${res.status} ${await res.text()}`)
  console.log(`  ✅ ${table}: ${rows.length}건 이관 완료`)
}

async function migrateStorage(bucket) {
  // 구 프로젝트 파일 목록
  const listRes = await fetch(
    `${OLD_URL}/storage/v1/object/list/${bucket}`,
    {
      method: 'POST',
      headers: {
        apikey: OLD_KEY,
        Authorization: `Bearer ${OLD_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prefix: '', limit: 1000 }),
    }
  )
  if (!listRes.ok) {
    console.log(`  ⚠️  Storage ${bucket}: 목록 조회 실패 (빈 버킷이거나 권한 문제)`)
    return
  }
  const files = await listRes.json()
  if (!files || files.length === 0) {
    console.log(`  Storage ${bucket}: 파일 없음, 스킵`)
    return
  }

  let copied = 0
  for (const file of files) {
    if (!file.name) continue
    // 다운로드
    const dlRes = await fetch(
      `${OLD_URL}/storage/v1/object/${bucket}/${file.name}`,
      { headers: { apikey: OLD_KEY, Authorization: `Bearer ${OLD_KEY}` } }
    )
    if (!dlRes.ok) { console.log(`  ⚠️  다운로드 실패: ${file.name}`); continue }
    const blob = await dlRes.arrayBuffer()

    // 업로드
    const ulRes = await fetch(
      `${NEW_URL}/storage/v1/object/${bucket}/${file.name}`,
      {
        method: 'POST',
        headers: {
          apikey: NEW_KEY,
          Authorization: `Bearer ${NEW_KEY}`,
          'Content-Type': file.metadata?.mimetype || 'application/octet-stream',
          'x-upsert': 'true',
        },
        body: blob,
      }
    )
    if (!ulRes.ok) { console.log(`  ⚠️  업로드 실패: ${file.name}`); continue }
    copied++
  }
  console.log(`  ✅ Storage ${bucket}: ${copied}/${files.length}개 복사 완료`)
}

async function main() {
  console.log('=== alltica Supabase 데이터 마이그레이션 ===')
  console.log(`구: ${OLD_URL}`)
  console.log(`신: ${NEW_URL}`)
  console.log('')

  // 1. 테이블 데이터
  console.log('[1/2] 테이블 데이터 이관 중...')
  for (const table of TABLES) {
    const rows = await readAll(OLD_URL, OLD_KEY, table)
    await insertAll(NEW_URL, NEW_KEY, table, rows)
  }

  // 2. Storage 파일
  console.log('')
  console.log('[2/2] Storage 파일 이관 중...')
  for (const bucket of ['business-cards', 'submission-files', 'seminar-images']) {
    await migrateStorage(bucket)
  }

  console.log('')
  console.log('=== 이관 완료 ===')
  console.log('신 Supabase Studio에서 데이터 확인 후 구 프로젝트를 삭제하세요.')
}

main().catch(err => { console.error('❌ 오류:', err.message, err.cause); process.exit(1) })
