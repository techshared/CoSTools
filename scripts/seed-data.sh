#!/bin/bash
# Seed demo data for Dashboard & Contribution Graph
# Run: bash scripts/seed-data.sh

set -e

echo "=== Seeding Dashboard Overview Data ==="

# 14 weeks of overview data (trending upward)
for i in $(seq 0 13); do
  WEEK=$(date -d "2026-02-02 + $i weeks" +%Y-%m-%d 2>/dev/null || date -j -f "%Y-%m-%d" -v+${i}w "2026-02-02" +%Y-%m-%d 2>/dev/null)
  HEALTH=$(echo "65 + $i * 2 + $RANDOM % 5" | bc -l)
  OKR=$(echo "50 + $i * 3 + $RANDOM % 8" | bc -l)
  TASK=$(echo "60 + $i * 2.5 + $RANDOM % 6" | bc -l)
  ACTIVE=$(echo "12 + $i / 4" | bc)
  COLLAB=$(echo "30 + $i * 2 + $RANDOM % 10" | bc -l)

  curl -s -X POST http://localhost:8003/api/v1/dashboard/ingest/overview \
    -H 'Content-Type: application/json' \
    -d "{
      \"team_id\": \"default\",
      \"week_start\": \"$WEEK\",
      \"team_health_score\": $HEALTH,
      \"okr_completion_rate\": $OKR,
      \"task_completion_rate\": $TASK,
      \"active_members\": $ACTIVE,
      \"collaboration_density\": $COLLAB,
      \"ai_insight\": \"第$(($i+1))周: 团队协作密度稳步提升，建议加强跨组代码评审\"
    }" > /dev/null

  echo "  Week $WEEK: health=$HEALTH okr=$OKR task=$TASK"
done

echo ""
echo "=== Seeding Dashboard Member Data ==="

MEMBERS=(
  "member-001:张三"
  "member-002:李四"
  "member-003:王五"
  "member-004:赵六"
  "member-005:钱七"
  "member-006:孙八"
)

for entry in "${MEMBERS[@]}"; do
  MID="${entry%%:*}"
  MNAME="${entry##*:}"

  for i in $(seq 0 13); do
    WEEK=$(date -d "2026-02-02 + $i weeks" 2>/dev/null +%Y-%m-%d || date -j -f "%Y-%m-%d" -v+${i}w "2026-02-02" +%Y-%m-%d 2>/dev/null)
    OKR=$(echo "55 + $i * 2 + $RANDOM % 15" | bc -l)
    TASK=$(echo "65 + $i * 1.5 + $RANDOM % 12" | bc -l)
    DOC=$(echo "2 + $i % 3 + $RANDOM % 3" | bc)
    CODE=$(echo "5 + $i / 2 + $RANDOM % 8" | bc)
    COLLAB=$(echo "40 + $i * 1.5 + $RANDOM % 15" | bc -l)

    curl -s -X POST http://localhost:8003/api/v1/dashboard/ingest/member \
      -H 'Content-Type: application/json' \
      -d "{
        \"member_id\": \"$MID\",
        \"week_start\": \"$WEEK\",
        \"okr_progress\": $OKR,
        \"task_completion_rate\": $TASK,
        \"doc_contributions\": $DOC,
        \"code_contributions\": $CODE,
        \"collaboration_score\": $COLLAB
      }" > /dev/null
  done

  echo "  $MNAME ($MID) - 14 weeks seeded"
done

echo ""
echo "=== Seeding Contribution Scores ==="

# Period-based scores
PERIODS=("2026-W06" "2026-W07" "2026-W08" "2026-W09" "2026-W10" "2026-W11" "2026-W12" "2026-W13")

for pid in $(seq 0 7); do
  PERIOD="${PERIODS[$pid]}"

  # 6 members with varying scores
  MEMBER_SCORES=$(cat <<-EOS
[
  {"member_id":"member-001","member_name":"张三","total_score":$(echo "85 + $pid * 3 + $RANDOM % 10" | bc -l),"dimension_scores":{"code_contributions":$(echo "80 + $pid * 3" | bc -l),"doc_contributions":$(echo "60 + $pid * 2" | bc -l),"code_review":$(echo "70 + $pid * 2" | bc -l),"design":$(echo "50 + $pid" | bc -l),"community":$(echo "90 + $pid" | bc -l)},"weekly_trend":[{"week":"$PERIOD","score":$(echo "85 + $pid * 3" | bc -l)}]},
  {"member_id":"member-002","member_name":"李四","total_score":$(echo "75 + $pid * 3 + $RANDOM % 10" | bc -l),"dimension_scores":{"code_contributions":$(echo "90 + $pid * 2" | bc -l),"doc_contributions":$(echo "50 + $pid * 2" | bc -l),"code_review":$(echo "60 + $pid * 3" | bc -l),"design":$(echo "70 + $pid" | bc -l),"community":$(echo "50 + $pid" | bc -l)},"weekly_trend":[{"week":"$PERIOD","score":$(echo "75 + $pid * 3" | bc -l)}]},
  {"member_id":"member-003","member_name":"王五","total_score":$(echo "65 + $pid * 3 + $RANDOM % 10" | bc -l),"dimension_scores":{"code_contributions":$(echo "60 + $pid * 2" | bc -l),"doc_contributions":$(echo "80 + $pid * 2" | bc -l),"code_review":$(echo "50 + $pid * 2" | bc -l),"design":$(echo "90 + $pid" | bc -l),"community":$(echo "70 + $pid" | bc -l)},"weekly_trend":[{"week":"$PERIOD","score":$(echo "65 + $pid * 3" | bc -l)}]},
  {"member_id":"member-004","member_name":"赵六","total_score":$(echo "55 + $pid * 3 + $RANDOM % 10" | bc -l),"dimension_scores":{"code_contributions":$(echo "50 + $pid * 2" | bc -l),"doc_contributions":$(echo "55 + $pid * 2" | bc -l),"code_review":$(echo "80 + $pid * 2" | bc -l),"design":$(echo "60 + $pid" | bc -l),"community":$(echo "60 + $pid" | bc -l)},"weekly_trend":[{"week":"$PERIOD","score":$(echo "55 + $pid * 3" | bc -l)}]},
  {"member_id":"member-005","member_name":"钱七","total_score":$(echo "45 + $pid * 3 + $RANDOM % 10" | bc -l),"dimension_scores":{"code_contributions":$(echo "40 + $pid * 2" | bc -l),"doc_contributions":$(echo "70 + $pid * 2" | bc -l),"code_review":$(echo "40 + $pid * 2" | bc -l),"design":$(echo "55 + $pid" | bc -l),"community":$(echo "80 + $pid" | bc -l)},"weekly_trend":[{"week":"$PERIOD","score":$(echo "45 + $pid * 3" | bc -l)}]},
  {"member_id":"member-006","member_name":"孙八","total_score":$(echo "35 + $pid * 3 + $RANDOM % 10" | bc -l),"dimension_scores":{"code_contributions":$(echo "30 + $pid * 2" | bc -l),"doc_contributions":$(echo "65 + $pid * 2" | bc -l),"code_review":$(echo "30 + $pid * 2" | bc -l),"design":$(echo "40 + $pid" | bc -l),"community":$(echo "55 + $pid" | bc -l)},"weekly_trend":[{"week":"$PERIOD","score":$(echo "35 + $pid * 3" | bc -l)}]}
]
EOS
)

  curl -s -X POST http://localhost:8004/api/v1/contributions/ingest/scores \
    -H 'Content-Type: application/json' \
    -d "{\"period\":\"$PERIOD\",\"members\":$MEMBER_SCORES}" > /dev/null

  echo "  Period $PERIOD - 6 members seeded"
done

echo ""
echo "=== Seeding Collaboration Edges ==="

# Create collaboration edges between members
EDGES=(
  "member-001:member-002:reviewed:3"
  "member-001:member-003:reviewed:2"
  "member-002:member-003:paired:4"
  "member-002:member-004:reviewed:2"
  "member-003:member-005:mentored:3"
  "member-004:member-006:reviewed:1"
  "member-001:member-005:reviewed:2"
  "member-003:member-006:paired:2"
  "member-002:member-005:reviewed:1"
  "member-004:member-001:reviewed:2"
)

for edge in "${EDGES[@]}"; do
  SRC="${edge%%:*}"
  REST="${edge#*:}"
  TGT="${REST%%:*}"
  REST2="${REST#*:}"
  TYPE="${REST2%%:*}"
  WEIGHT="${REST2##*:}"

  curl -s -X POST http://localhost:8004/api/v1/contributions/ingest/edge \
    -H 'Content-Type: application/json' \
    -d "{
      \"source_member_id\": \"$SRC\",
      \"target_member_id\": \"$TGT\",
      \"edge_type\": \"$TYPE\",
      \"weight\": $WEIGHT,
      \"period\": \"2026-W13\"
    }" > /dev/null

  echo "  $SRC -> $TGT ($TYPE, weight=$WEIGHT)"
done

echo ""
echo "=== Seeding Current User (demo) ==="

curl -s -X POST http://localhost:8004/api/v1/contributions/ingest/scores \
  -H 'Content-Type: application/json' \
  -d '{
    "period": "2026-W13",
    "members": [
      {
        "member_id": "current-user",
        "member_name": "当前用户",
        "total_score": 92,
        "dimension_scores": {
          "code_contributions": 88,
          "doc_contributions": 75,
          "code_review": 95,
          "design": 70,
          "community": 85
        },
        "weekly_trend": [
          {"week":"2026-W08","score":65},
          {"week":"2026-W09","score":72},
          {"week":"2026-W10","score":78},
          {"week":"2026-W11","score":82},
          {"week":"2026-W12","score":88},
          {"week":"2026-W13","score":92}
        ]
      }
    ]
  }' > /dev/null

echo "  Current user seeded (score=92)"

curl -s -X POST http://localhost:8003/api/v1/dashboard/ingest/member \
  -H 'Content-Type: application/json' \
  -d '{
    "member_id": "current-user",
    "week_start": "2026-05-04",
    "okr_progress": 85,
    "task_completion_rate": 78,
    "doc_contributions": 5,
    "code_contributions": 12,
    "collaboration_score": 72
  }' > /dev/null

echo "  Current user dashboard seeded"

echo ""
echo "=== All data seeded successfully ==="
echo ""
echo "View results:"
echo "  Dashboard: https://fstool.123tips.cn/dashboard"
echo "  Contribution: https://fstool.123tips.cn/contribution"
