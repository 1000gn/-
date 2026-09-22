"""AI Studio '말씀 카드 자동발행기' Export JSON 가져오기.

사용법:
  py -V:3.13 import_aistudio.py x-wordcard-schedule-sync-2026-09-17.json
  py -V:3.13 import_aistudio.py <json경로> --images ./import_images

동작:
  1. Export JSON의 스케줄(요일/시간/자동발행)을 data/settings.json에 저장
     - 요일 변환: JS(0=일) → Python(0=월): py = (js + 6) % 7
  2. 승인 대기열(approvedCardsQueue)을 data/queue.json에 추가 (중복 ID 제외)
  3. import_images/ 폴더에서 카드ID가 들어간 이미지 파일을 찾아 매칭
     - 파일명 규칙: 말씀카드_완성본_<카테고리>_<ID앞8자리>_1200x675.png
     - 이미지가 없어도 등록은 됨 → 발행 시 기본 카드 이미지로 자동 대체
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE))

if getattr(sys.stdout, "reconfigure", None):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from core.store import load_posts, load_queue, load_settings, save_queue, save_settings  # noqa: E402

MAX_TWEET_CHARS = 270
MANDATORY_TAGS = [
    "#지혜의말씀", "#명언", "#주일말씀", "#정명석목사님",
    "#기독교복음선교회", "#월명동자연성전", "#잠언", "#예수님", "#하나님",
]
MANDATORY_TAGS_STR = " ".join(MANDATORY_TAGS)
IMAGE_DIR = BASE / "import_images"
IMAGE_DIR.mkdir(exist_ok=True)


def js_weekday_to_py(js_day: int) -> int:
    return (int(js_day) + 6) % 7


def ensure_mandatory_tags(tweet: str, limit: int = MAX_TWEET_CHARS) -> str:
    clean = (tweet or "").strip()
    for tag in MANDATORY_TAGS:
        clean = clean.replace(tag, "").strip()
    clean = re.sub(r"[\n\s]*#+\s*$", "", clean).strip()
    suffix = "\n\n" + MANDATORY_TAGS_STR
    max_body = max(20, limit - len(suffix))
    if len(clean) > max_body:
        clean = clean[: max(10, max_body - 3)].strip() + "..."
    return f"{clean}{suffix}".strip()


def find_image(card_id: str, image_dir: Path = IMAGE_DIR) -> str | None:
    """카드ID 앞 8자리로 이미지 파일 탐색. 완성본 우선."""
    if not image_dir.exists():
        return None
    key = str(card_id)[:8]
    cands = [p for p in image_dir.iterdir()
             if p.is_file() and key in p.name
             and p.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp")]
    if not cands:
        return None
    cands.sort(key=lambda p: (0 if "완성본" in p.name else 1, p.name))
    return str(cands[0])


def import_export_json(json_path: Path, image_dir: Path = IMAGE_DIR) -> dict:
    data = json.loads(json_path.read_text(encoding="utf-8"))

    # 1. 스케줄 반영
    sched = data.get("schedule", {})
    js_days = [w.get("dayCode") for w in sched.get("weekdays", []) if w.get("dayCode") is not None]
    time_str = sched.get("postingTime", "09:00")
    hour, minute = (int(x) for x in str(time_str).split(":")[:2])

    settings = load_settings()
    if js_days:
        settings["weekdays"] = sorted({js_weekday_to_py(d) for d in js_days})
    settings["hour"] = hour
    settings["minute"] = minute
    settings["auto_mode"] = bool(sched.get("autoPostEnabled", False))
    save_settings(settings)

    # 2. 승인 대기열 반영 (중복 제외)
    queued_ids = {c.get("card_id") for c in load_queue()}
    posted_ids = {p.get("card_id") for p in load_posts() if p.get("card_id")}
    queue = load_queue()
    added, no_image = 0, 0

    for c in data.get("approvedCardsQueue", []):
        cid = str(c.get("id", ""))
        if not cid or cid in queued_ids or cid in posted_ids:
            continue
        img = find_image(cid, image_dir)
        if img is None:
            no_image += 1
        queue.append({
            "card_id": cid,
            "category": c.get("category", ""),
            "coreQuote": c.get("coreQuote", ""),
            "topic": c.get("topic", ""),
            "tweet": ensure_mandatory_tags(c.get("tweetBody", "")),
            "sourceType": c.get("sourceType", "ai"),
            "image": img,  # 없으면 발행 시 기본 카드로 대체
        })
        queued_ids.add(cid)
        added += 1

    save_queue(queue)
    return {"added": added, "no_image": no_image, "queue_total": len(queue), "settings": settings}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("json", help="AI Studio에서 Export한 JSON 파일 경로")
    ap.add_argument("--images", default=str(IMAGE_DIR), help="다운로드한 카드 이미지 폴더")
    args = ap.parse_args()

    jp = Path(args.json)
    if not jp.exists():
        print(f"JSON 파일을 찾을 수 없습니다: {jp}", file=sys.stderr)
        sys.exit(1)

    result = import_export_json(jp, Path(args.images))
    s = result["settings"]
    print(f"스케줄 저장: 요일(Python 0=월)={s['weekdays']}, {s['hour']:02d}:{s['minute']:02d}, 자동모드={s['auto_mode']}")
    print(f"큐 추가: {result['added']}건 (이미지 없음→발행시 자동생성: {result['no_image']}건), 전체 대기 {result['queue_total']}건")
    if result["no_image"]:
        print(f"※ {Path(args.images).resolve()} 폴더에 카드 이미지를 넣고 같은 명령을 다시 실행하면 이미지가 매칭됩니다.")


if __name__ == "__main__":
    main()
