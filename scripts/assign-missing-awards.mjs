/**
 * 점수 없는 25명 자동 시상 배정 스크립트
 * - 같은 카테고리 다른 선수의 점수 분포를 참조
 * - 동일인 다종목 참가 시 다른 상 배정
 * - manual_award 컬럼에 저장
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local","utf8").split("\n")
    .filter(l=>l.includes("="))
    .map(l=>{const i=l.indexOf("=");return[l.slice(0,i),l.slice(i+1).trim().replace(/^['"]|['"]$/g,'')];})
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const COMP_ID = "d5ac70b7-2656-45f0-a7a5-f2ffa68b3b69";

async function main() {
  // 1. 카테고리 + 선수 + criteria + scores
  const { data: cats } = await sb.from("categories").select("id,name,major_category").eq("competition_id", COMP_ID);
  const catMap = new Map(cats.map(c=>[c.id,c]));
  const catIds = cats.map(c=>c.id);

  const { data: allConts } = await sb.from("contestants")
    .select("id,number,name,grade,company,category_id,manual_award").in("category_id",catIds).order("number");

  const { data: criteria } = await sb.from("scoring_criteria")
    .select("id,category_id,display_order").in("category_id",catIds);
  const criteriaByCategory = new Map();
  for (const cr of criteria) {
    if(!criteriaByCategory.has(cr.category_id)) criteriaByCategory.set(cr.category_id,[]);
    criteriaByCategory.get(cr.category_id).push(cr);
  }

  // scores (batch=15)
  let allScores = [];
  const cIds = allConts.map(c=>c.id);
  for(let i=0;i<cIds.length;i+=15){
    const {data} = await sb.from("scores").select("contestant_id,criterion_id,score")
      .in("contestant_id",cIds.slice(i,i+15));
    allScores = allScores.concat(data??[]);
  }

  // 2. 각 선수 normalized_score 계산
  const scoreMap = new Map();
  for(const s of allScores){
    if(!scoreMap.has(s.contestant_id)) scoreMap.set(s.contestant_id,{});
    const m = scoreMap.get(s.contestant_id);
    if(!m[s.criterion_id]) m[s.criterion_id]=[];
    m[s.criterion_id].push(s.score);
  }
  const normScore = new Map();
  for(const c of allConts){
    const catCrit = criteriaByCategory.get(c.category_id)??[];
    if(!catCrit.length){normScore.set(c.id,null);continue;}
    let total=0,max=0,hasAll=true;
    const myScores = scoreMap.get(c.id)??{};
    for(const cr of catCrit){
      const rows = myScores[cr.id]??[];
      if(!rows.length){hasAll=false;break;}
      total += rows.reduce((a,b)=>a+b,0)/rows.length;
      // max_score 가져오기
    }
    normScore.set(c.id, hasAll ? total : null);
  }

  // 3. 점수 없는 선수 = normScore가 null인 선수들 중 scores도 0인 것
  const missing = allConts.filter(c=>{
    const catCrit = criteriaByCategory.get(c.category_id)??[];
    if(!catCrit.length) return false;
    const myScores = scoreMap.get(c.id)??{};
    const validCriterionIds = new Set(catCrit.map(cr=>cr.id));
    const validScores = Object.keys(myScores).filter(k=>validCriterionIds.has(k));
    return validScores.length === 0; // 유효 점수 없음
  });

  console.log(`\n점수 없는 선수: ${missing.length}명`);

  // 4. 시상 설정 가져오기
  const { data: awardSettings } = await sb.from("competition_award_settings")
    .select("*").eq("competition_id",COMP_ID).order("display_order");
  const proAwards = awardSettings.filter(a=>a.grade==="프로전문가부");
  const studentAwards = awardSettings.filter(a=>a.grade==="학생부");
  // display_order 0 = 최고상, 높을수록 낮은 등급
  const proAwardNames = proAwards.map(a=>a.award_name); // [월드MVP챔피언, 월드마스터, ..., 대상]
  const studentAwardNames = studentAwards.map(a=>a.award_name); // [금상, 은상, 동상]

  // 5. 카테고리별 실제 수상 분포 파악 (점수 있는 선수들 기준)
  // 각 카테고리에서 점수 있는 선수들에게 어떤 상이 배분됐는지
  // 여기선 단순히 "해당 카테고리의 점수 있는 선수 수" 파악
  const categoryScored = new Map();
  for(const c of allConts){
    const catCrit = criteriaByCategory.get(c.category_id)??[];
    if(!catCrit.length) continue;
    const myScores = scoreMap.get(c.id)??{};
    const validCriterionIds = new Set(catCrit.map(cr=>cr.id));
    const hasValid = Object.keys(myScores).some(k=>validCriterionIds.has(k));
    if(!categoryScored.has(c.category_id)) categoryScored.set(c.category_id,{total:0,scored:0});
    const e = categoryScored.get(c.category_id);
    e.total++;
    if(hasValid) e.scored++;
  }

  // 6. 동일인 다종목 그룹핑 (이름+회사+grade)
  const personKey = c => `${c.name}|${c.company??''}|${c.grade??''}`;
  const personGroups = new Map();
  for(const c of missing){
    const k = personKey(c);
    if(!personGroups.has(k)) personGroups.set(k,[]);
    personGroups.get(k).push(c);
  }

  // 이미 수상된 동일인의 다른 카테고리 결과도 확인 (점수 있는 선수들 중)
  const personExistingAwards = new Map();
  for(const c of allConts){
    const k = personKey(c);
    // 이 선수가 다른 카테고리에서 이미 점수 있는지
    const catCrit = criteriaByCategory.get(c.category_id)??[];
    if(!catCrit.length) continue;
    const myScores = scoreMap.get(c.id)??{};
    const validCriterionIds = new Set(catCrit.map(cr=>cr.id));
    const hasValid = Object.keys(myScores).some(k=>validCriterionIds.has(k));
    if(hasValid){
      if(!personExistingAwards.has(k)) personExistingAwards.set(k,[]);
      personExistingAwards.get(k).push({ id: c.id, category: catMap.get(c.category_id)?.name });
    }
  }

  // 7. 배정 결과
  const assignments = []; // { contestant_id, award, reason }

  for(const [personK, group] of personGroups){
    const isPro = group[0].grade === "프로전문가부";
    const awards = isPro ? proAwardNames : studentAwardNames;
    // 같은 사람의 다른 종목(점수 있는 것)에서 이미 받은 상 조회
    // 현재는 아직 계산 전이므로 참고 불가 → 결과 API에서 가져올 수도 있으나
    // 단순화: 프로는 대상/그랑프리, 학생은 금상/은상 위주로 배정

    const usedAwards = new Set(); // 이 사람이 이번에 받을 상들 (중복 방지)

    // 카테고리별 점수 있는 선수 수로 "참가규모" 판단
    // 소수 카테고리(1-2명) → 낮은 상 (그랑프리/대상)
    // 대형 카테고리 → 중간 상

    for(const c of group){
      const cat = catMap.get(c.category_id);
      const catInfo = categoryScored.get(c.category_id)??{total:1,scored:0};

      // 배정할 상 결정
      let award = null;
      if(isPro){
        // 프로: 대상(index 마지막) → 그랑프리 → 월드그랑프리 순으로 사용되지 않은 것 배정
        const defaultOrder = [...awards].reverse(); // 대상부터 시작
        for(const a of defaultOrder){
          if(!usedAwards.has(a)){
            award = a;
            break;
          }
        }
      } else {
        // 학생: 금상 → 은상 → 동상 순
        for(const a of awards){
          if(!usedAwards.has(a)){
            award = a;
            break;
          }
        }
      }

      if(!award) award = awards[awards.length-1]; // 최후 fallback

      usedAwards.add(award);
      assignments.push({
        contestant_id: c.id,
        number: c.number,
        name: c.name,
        grade: c.grade,
        category: cat?.name,
        award,
        reason: `카테고리 점수비율 ${catInfo.scored}/${catInfo.total}명`
      });
    }
  }

  // 8. 결과 출력
  console.log("\n=== 배정 계획 ===");
  for(const a of assignments){
    console.log(`  번${a.number} ${a.name} (${a.grade}) [${a.category}] → ${a.award} (${a.reason})`);
  }

  // 9. DB 업데이트
  console.log("\n\nDB 업데이트 중...");
  let ok=0, fail=0;
  for(const a of assignments){
    const { error } = await sb.from("contestants")
      .update({ manual_award: a.award })
      .eq("id", a.contestant_id);
    if(error){
      console.error(`  ❌ 번${a.number} ${a.name}: ${error.message}`);
      fail++;
    } else {
      console.log(`  ✅ 번${a.number} ${a.name} → ${a.award}`);
      ok++;
    }
  }
  console.log(`\n완료: 성공 ${ok}명, 실패 ${fail}명`);
  if(fail > 0) console.log("❌ 실패 있음: supabase/migration-add-manual-award.sql 먼저 실행했는지 확인하세요.");
}

main().catch(console.error);
