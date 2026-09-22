"""스케줄 자동 발행 스크립트.
사용법:
  python auto_post.py --once   # 지금 발행 시간이면 1건 발행 (작업 스케줄러용, 1시간마다 등록)
  python auto_post.py --loop   # 포그라운드 상시 실행 (5분마다 체크)
  python auto_post.py --force  # 시간 무시하고 즉시 1건 발행 (테스트용)
  python auto_post.py --dry-run  # 발행 없이 다음 발행 내용만 미리보기

발행 우선순위: AI Studio 큐(data/queue.json) → 없으면 Gemini 자동생성.
"""
from __future__ import annotations

import argparse
import os
import sys
import time
from datetime import datetime

from dotenv import load_dotenv

load_dotenv()

import sys as _sys

if getattr(_sys.stdout, "reconfigure", None):
    try:
        _sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from core.image_maker import make_card
from core.quotes import generate_quote
from core.store import add_post, last_post_date, load_queue, load_settings, pop_next_queued
from core.x_post import post_tweet


def should_post_now(settings: dict, now: datetime | None = None) -> bool:
    now = now or datetime.now()
    if now.weekday() not in settings.get("weekdays", []):
        return False
    # 정시 ±59분 윈도우 (1시간마다 실행돼도 1회만 걸리도록, 중복은 last_post_date로 방지)
    if now.hour != settings.get("hour", 9):
        return False
    if last_post_date() == now.date().isoformat():
        return False
    return True


def peek_next() -> dict | None:
    """발행 없이 다음 발행 후보 미리보기 (큐 1순위, 없으면 None)."""
    q = load_queue()
    if q:
        return {"mode": "queue", **q[0]}
    return None


def do_post(dry_run: bool = False) -> dict:
    settings = load_settings()
    queued = pop_next_queued() if not dry_run else (load_queue()[0] if load_queue() else None)

    if queued:
        import os as _os

        tweet = queued.get("tweet", "")
        img = queued.get("image")
        if img and not _os.path.exists(img):
            img = None
        if not img:
            # 다운로드 이미지가 없으면 기본 카드 이미지로 대체 생성
            img = make_card(queued.get("coreQuote", "")[:60] or "오늘의 말씀",
                            queued.get("topic", ""), queued.get("category", ""))
        if dry_run:
            return {"mode": "queue", "tweet": tweet, "image": img,
                    "card_id": queued.get("card_id"), "url": "(미리보기)"}
        res = post_tweet(
            tweet, img,
            _os.getenv("X_API_KEY", ""), _os.getenv("X_API_SECRET", ""),
            _os.getenv("X_ACCESS_TOKEN", ""), _os.getenv("X_ACCESS_SECRET", ""),
        )
        entry = {"tweet": tweet, "image": img, "url": res["url"], "id": res["id"],
                 "card_id": queued.get("card_id"), "category": queued.get("category", ""),
                 "status": "posted(queue)", "source": f"aistudio:{queued.get('sourceType', 'ai')}"}
        add_post(entry)
        return entry

    # 큐가 비었으면 기존 Gemini 자동생성 경로
    data = generate_quote(os.getenv("GEMINI_API_KEY", ""), settings.get("hint", "꾸준함·습관"))
    img = make_card(data["quote_ko"], data.get("quote_en", ""), data.get("author", ""))
    if dry_run:
        return {"mode": "generate", "tweet": data["tweet"], "image": img, "url": "(미리보기)"}
    res = post_tweet(
        data["tweet"], img,
        os.getenv("X_API_KEY", ""), os.getenv("X_API_SECRET", ""),
        os.getenv("X_ACCESS_TOKEN", ""), os.getenv("X_ACCESS_SECRET", ""),
    )
    entry = {"tweet": data["tweet"], "image": img, "url": res["url"], "id": res["id"],
             "status": "posted(auto)", "source": data.get("source")}
    add_post(entry)
    return entry


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--once", action="store_true")
    ap.add_argument("--loop", action="store_true")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if args.dry_run:
        nxt = peek_next()
        if nxt:
            print(f"[큐] card_id={nxt.get('card_id')} ({nxt.get('category')}/{nxt.get('sourceType')})")
            print(f"이미지: {nxt.get('image') or '(없음→발행시 자동생성)'}")
            print(f"글자수: {len(nxt.get('tweet', ''))}자")
            print("---")
            print(nxt.get("tweet", ""))
        else:
            print("큐가 비어 있습니다. --force/--once 발행 시 Gemini 자동생성 경로로 동작합니다.")
        return

    if args.force:
        e = do_post()
        print(f"발행 완료: {e['url']}")
        return

    if args.loop:
        print("자동 모드 실행 중 (Ctrl+C로 종료, 5분마다 체크)...")
        while True:
            s = load_settings()
            if s.get("auto_mode") and should_post_now(s):
                try:
                    e = do_post()
                    print(f"[{datetime.now():%H:%M}] 발행 완료: {e['url']}")
                except Exception as ex:
                    print(f"[{datetime.now():%H:%M}] 발행 실패: {ex}", file=sys.stderr)
            time.sleep(300)
        return

    # --once (기본)
    s = load_settings()
    if not s.get("auto_mode"):
        print("자동 모드가 꺼져 있습니다. 대시보드 사이드바에서 켜주세요.")
        return
    if should_post_now(s):
        e = do_post()
        print(f"발행 완료: {e['url']}")
    else:
        print(f"지금은 발행 시간이 아닙니다. ({datetime.now():%m/%d %H:%M}, 요일={datetime.now().weekday()})")


if __name__ == "__main__":
    main()
