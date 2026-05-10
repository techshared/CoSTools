#!/usr/bin/env python3
"""Seed CoSTools with realistic demo data."""
import json
import random
import urllib.request
from datetime import date, timedelta

DASHBOARD_URL = "http://localhost:8003"
CONTRIBUTION_URL = "http://localhost:8004"
random.seed(42)


def post(url, data):
    """POST JSON data and return response."""
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req) as resp:
        return resp.read().decode()


print("=== Seeding Dashboard Overview Data ===")

base = date(2026, 2, 2)
for i in range(14):
    week = base + timedelta(weeks=i)
    health = round(65 + i * 2 + random.uniform(0, 5), 1)
    okr = round(50 + i * 3 + random.uniform(0, 8), 1)
    task = round(60 + i * 2.5 + random.uniform(0, 6), 1)
    active = 12 + i // 4
    collab = round(30 + i * 2 + random.uniform(0, 10), 1)

    post(f"{DASHBOARD_URL}/api/v1/dashboard/ingest/overview", {
        "team_id": "default",
        "week_start": week.isoformat(),
        "team_health_score": health,
        "okr_completion_rate": okr,
        "task_completion_rate": task,
        "active_members": active,
        "collaboration_density": collab,
        "ai_insight": f"第{i+1}周: 团队协作密度稳步提升，建议加强跨组代码评审",
    })
    print(f"  Week {week}")

print("\n=== Seeding Dashboard Member Data ===")

members = [
    ("member-001", "张三"),
    ("member-002", "李四"),
    ("member-003", "王五"),
    ("member-004", "赵六"),
    ("member-005", "钱七"),
    ("member-006", "孙八"),
]

for mid, mname in members:
    for i in range(14):
        week = base + timedelta(weeks=i)
        okr = round(55 + i * 2 + random.uniform(0, 15), 1)
        task = round(65 + i * 1.5 + random.uniform(0, 12), 1)
        doc = 2 + i % 3 + random.randint(0, 3)
        code = 5 + i // 2 + random.randint(0, 8)
        collab = round(40 + i * 1.5 + random.uniform(0, 15), 1)

        post(f"{DASHBOARD_URL}/api/v1/dashboard/ingest/member", {
            "member_id": mid,
            "week_start": week.isoformat(),
            "okr_progress": okr,
            "task_completion_rate": task,
            "doc_contributions": doc,
            "code_contributions": code,
            "collaboration_score": collab,
        })
    print(f"  {mname} ({mid}) - 14 weeks seeded")

print("\n=== Seeding Contribution Scores ===")

periods = [f"2026-W{w:02d}" for w in range(6, 14)]

for pi, period in enumerate(periods):
    member_scores = [
        {
            "member_id": "member-001",
            "member_name": "张三",
            "total_score": round(85 + pi * 3 + random.uniform(0, 10), 1),
            "dimension_scores": {
                "code_contributions": 80 + pi * 3,
                "doc_contributions": 60 + pi * 2,
                "code_review": 70 + pi * 2,
                "design": 50 + pi,
                "community": 90 + pi,
            },
            "weekly_trend": [{"week": period, "score": 85 + pi * 3}],
        },
        {
            "member_id": "member-002",
            "member_name": "李四",
            "total_score": round(75 + pi * 3 + random.uniform(0, 10), 1),
            "dimension_scores": {
                "code_contributions": 90 + pi * 2,
                "doc_contributions": 50 + pi * 2,
                "code_review": 60 + pi * 3,
                "design": 70 + pi,
                "community": 50 + pi,
            },
            "weekly_trend": [{"week": period, "score": 75 + pi * 3}],
        },
        {
            "member_id": "member-003",
            "member_name": "王五",
            "total_score": round(65 + pi * 3 + random.uniform(0, 10), 1),
            "dimension_scores": {
                "code_contributions": 60 + pi * 2,
                "doc_contributions": 80 + pi * 2,
                "code_review": 50 + pi * 2,
                "design": 90 + pi,
                "community": 70 + pi,
            },
            "weekly_trend": [{"week": period, "score": 65 + pi * 3}],
        },
        {
            "member_id": "member-004",
            "member_name": "赵六",
            "total_score": round(55 + pi * 3 + random.uniform(0, 10), 1),
            "dimension_scores": {
                "code_contributions": 50 + pi * 2,
                "doc_contributions": 55 + pi * 2,
                "code_review": 80 + pi * 2,
                "design": 60 + pi,
                "community": 60 + pi,
            },
            "weekly_trend": [{"week": period, "score": 55 + pi * 3}],
        },
        {
            "member_id": "member-005",
            "member_name": "钱七",
            "total_score": round(45 + pi * 3 + random.uniform(0, 10), 1),
            "dimension_scores": {
                "code_contributions": 40 + pi * 2,
                "doc_contributions": 70 + pi * 2,
                "code_review": 40 + pi * 2,
                "design": 55 + pi,
                "community": 80 + pi,
            },
            "weekly_trend": [{"week": period, "score": 45 + pi * 3}],
        },
        {
            "member_id": "member-006",
            "member_name": "孙八",
            "total_score": round(35 + pi * 3 + random.uniform(0, 10), 1),
            "dimension_scores": {
                "code_contributions": 30 + pi * 2,
                "doc_contributions": 65 + pi * 2,
                "code_review": 30 + pi * 2,
                "design": 40 + pi,
                "community": 55 + pi,
            },
            "weekly_trend": [{"week": period, "score": 35 + pi * 3}],
        },
    ]

    post(f"{CONTRIBUTION_URL}/api/v1/contributions/ingest/scores", {
        "period": period,
        "members": member_scores,
    })
    print(f"  Period {period} - 6 members seeded")

print("\n=== Seeding Collaboration Edges ===")

edges = [
    ("member-001", "member-002", "reviewed", 3),
    ("member-001", "member-003", "reviewed", 2),
    ("member-002", "member-003", "paired", 4),
    ("member-002", "member-004", "reviewed", 2),
    ("member-003", "member-005", "mentored", 3),
    ("member-004", "member-006", "reviewed", 1),
    ("member-001", "member-005", "reviewed", 2),
    ("member-003", "member-006", "paired", 2),
    ("member-002", "member-005", "reviewed", 1),
    ("member-004", "member-001", "reviewed", 2),
]

for src, tgt, etype, w in edges:
    post(f"{CONTRIBUTION_URL}/api/v1/contributions/ingest/edge", {
        "source_member_id": src,
        "target_member_id": tgt,
        "edge_type": etype,
        "weight": w,
        "period": "2026-W13",
    })
    print(f"  {src} -> {tgt} ({etype}, weight={w})")

print("\n=== Seeding Current User ===")

post(f"{CONTRIBUTION_URL}/api/v1/contributions/ingest/scores", {
    "period": "2026-W13",
    "members": [{
        "member_id": "current-user",
        "member_name": "当前用户",
        "total_score": 92,
        "dimension_scores": {
            "code_contributions": 88,
            "doc_contributions": 75,
            "code_review": 95,
            "design": 70,
            "community": 85,
        },
        "weekly_trend": [
            {"week": "2026-W08", "score": 65},
            {"week": "2026-W09", "score": 72},
            {"week": "2026-W10", "score": 78},
            {"week": "2026-W11", "score": 82},
            {"week": "2026-W12", "score": 88},
            {"week": "2026-W13", "score": 92},
        ],
    }],
})
print("  Current user seeded (score=92)")

post(f"{DASHBOARD_URL}/api/v1/dashboard/ingest/member", {
    "member_id": "current-user",
    "week_start": "2026-05-04",
    "okr_progress": 85,
    "task_completion_rate": 78,
    "doc_contributions": 5,
    "code_contributions": 12,
    "collaboration_score": 72,
})
print("  Current user dashboard seeded")

print("\n=== All data seeded successfully ===")
print()
print("  Dashboard:    https://fstool.123tips.cn/dashboard")
print("  Contribution: https://fstool.123tips.cn/contribution")
