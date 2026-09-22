"""발행 히스토리 + 스케줄 설정 저장 (data/*.json)."""
from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
DATA_DIR = BASE / "data"
DATA_DIR.mkdir(exist_ok=True)
POSTS_FILE = DATA_DIR / "posts.json"
SETTINGS_FILE = DATA_DIR / "settings.json"
QUEUE_FILE = DATA_DIR / "queue.json"

DEFAULT_SETTINGS = {
    # 이틀 간격 주4회 예시: 월(0) 수(2) 금(4) 일(6), 오전 9시
    "weekdays": [0, 2, 4, 6],
    "hour": 9,
    "minute": 0,
    "auto_mode": False,
    "hint": "꾸준함·습관",
}


def load_settings() -> dict:
    if SETTINGS_FILE.exists():
        try:
            d = json.loads(SETTINGS_FILE.read_text(encoding="utf-8"))
            return {**DEFAULT_SETTINGS, **d}
        except Exception:
            pass
    return dict(DEFAULT_SETTINGS)


def save_settings(s: dict) -> None:
    SETTINGS_FILE.write_text(json.dumps(s, ensure_ascii=False, indent=2), encoding="utf-8")


def load_posts() -> list[dict]:
    if POSTS_FILE.exists():
        try:
            return json.loads(POSTS_FILE.read_text(encoding="utf-8"))
        except Exception:
            return []
    return []


def add_post(entry: dict) -> list[dict]:
    posts = load_posts()
    entry["logged_at"] = datetime.now().isoformat(timespec="seconds")
    posts.insert(0, entry)
    POSTS_FILE.write_text(json.dumps(posts, ensure_ascii=False, indent=2), encoding="utf-8")
    return posts


def last_post_date() -> str | None:
    posts = load_posts()
    if not posts:
        return None
    return posts[0].get("logged_at", "")[:10]


# ---------- AI Studio 발행 큐 ----------

def load_queue() -> list[dict]:
    if QUEUE_FILE.exists():
        try:
            data = json.loads(QUEUE_FILE.read_text(encoding="utf-8"))
            return data if isinstance(data, list) else []
        except Exception:
            return []
    return []


def save_queue(q: list[dict]) -> None:
    QUEUE_FILE.write_text(json.dumps(q, ensure_ascii=False, indent=2), encoding="utf-8")


def pop_next_queued() -> dict | None:
    """가장 오래된 대기 카드 1개를 꺼내 반환 (큐에서 제거). 없으면 None."""
    q = load_queue()
    if not q:
        return None
    item = q.pop(0)
    save_queue(q)
    return item
