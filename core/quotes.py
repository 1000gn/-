"""Gemini로 동기부여 명언 생성. 키 없거나 실패 시 내장 명언으로 폴백."""
from __future__ import annotations

import json
import random
import re
from datetime import date

FALLBACK_QUOTES = [
    {"quote_ko": "시작이 반이다.", "quote_en": "Well begun is half done.", "author": "아리스토텔레스"},
    {"quote_ko": "어제보다 오늘, 오늘보다 내일 더 나아가자.", "quote_en": "Go further today than yesterday.", "author": "오늘의 다짐"},
    {"quote_ko": "포기하지 않는 한 실패는 없다.", "quote_en": "There is no failure except in no longer trying.", "author": "엘버트 허버드"},
    {"quote_ko": "작은 습관이 큰 변화를 만든다.", "quote_en": "Small habits make a big change.", "author": "오늘의 다짐"},
    {"quote_ko": "할 수 있다고 믿는 순간, 이미 절반은 이룬 것이다.", "quote_en": "Believe you can and you're halfway there.", "author": "시어도어 루스벨트"},
    {"quote_ko": "늦었다고 생각할 때가 가장 빠른 때다.", "quote_en": "The best time to start was yesterday. The second best is now.", "author": "중국 속담"},
    {"quote_ko": "하루하루가 새로운 기회다.", "quote_en": "Every day is a new opportunity.", "author": "오늘의 다짐"},
    {"quote_ko": "행동이 모든 두려움을 이긴다.", "quote_en": "Action conquers fear.", "author": "오늘의 다짐"},
    {"quote_ko": "꿈을 크게, 시작을 작게, 실천을 꾸준히.", "quote_en": "Dream big, start small, act consistently.", "author": "오늘의 다짐"},
    {"quote_ko": "성공은 매일의 작은 노력의 합이다.", "quote_en": "Success is the sum of small efforts repeated daily.", "author": "로버트 콜리어"},
    {"quote_ko": "넘어지는 것은 실패가 아니라, 일어나지 않는 것이 실패다.", "quote_en": "Falling is not failure. Staying down is.", "author": "오늘의 다짐"},
    {"quote_ko": "자신을 믿어라. 너는 생각보다 강하다.", "quote_en": "Believe in yourself. You are stronger than you think.", "author": "오늘의 다짐"},
    {"quote_ko": "오늘의 땀이 내일의 빛이 된다.", "quote_en": "Today's sweat becomes tomorrow's light.", "author": "오늘의 다짐"},
    {"quote_ko": "완벽한 때를 기다리지 말고 지금 시작하라.", "quote_en": "Don't wait for the perfect moment. Start now.", "author": "오늘의 다짐"},
    {"quote_ko": "천 리 길도 한 걸음부터.", "quote_en": "A journey of a thousand miles begins with a single step.", "author": "노자"},
]

PROMPT_TEMPLATE = """너는 X(트위터) 동기부여 계정의 작가야.
중복되지 않는 동기부여 명언 콘텐츠 1개를 JSON으로만 출력해.
조건:
- 한국 독자에게 울림 있는 내용, 너무 진부한 명언은 피하고 실용적 응원 위주
- quote_ko: 한국어 명언 (30자 이내, 1~2문장)
- quote_en: 영어 원문 또는 영문 번역 (짧게)
- author: 저자 (실존 인물이거나 '오늘의 다짐')
- tweet: X 게시글 본문. 220자 이내, 이모지 1~2개, 줄바꿈 포함, 해시태그 2개(#동기부여 #오늘의명언 등) 포함
- 카테고리 힌트: {hint}

반드시 아래 JSON 형식만 출력 (마크다운 코드블록 금지):
{{"quote_ko": "...", "quote_en": "...", "author": "...", "tweet": "..."}}
"""


def _fallback(hint: str = "") -> dict:
    q = random.choice(FALLBACK_QUOTES)
    tweet = (
        f"💪 {q['quote_ko']}\n"
        f'"{q["quote_en"]}" - {q["author"]}\n\n'
        f"#동기부여 #오늘의명언 #자기계발"
    )
    return {**q, "tweet": tweet, "source": "fallback", "hint": hint}


def generate_quote(gemini_api_key: str = "", hint: str = "꾸준함·습관") -> dict:
    """Gemini 호출 → dict(quote_ko, quote_en, author, tweet, source)."""
    if not gemini_api_key:
        return _fallback(hint)

    try:
        from google import genai

        client = genai.Client(api_key=gemini_api_key)
        resp = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=PROMPT_TEMPLATE.format(hint=hint),
        )
        text = (resp.text or "").strip()
        # 코드블록으로 감싸져 오면 벗기기
        text = re.sub(r"^```(?:json)?|```$", "", text.strip(), flags=re.MULTILINE).strip()
        m = re.search(r"\{.*\}", text, flags=re.DOTALL)
        data = json.loads(m.group(0) if m else text)
        for k in ("quote_ko", "quote_en", "author", "tweet"):
            if k not in data:
                raise ValueError(f"missing key: {k}")
        # X 글자수(280) 안전장치
        if len(data["tweet"]) > 275:
            data["tweet"] = data["tweet"][:272] + "..."
        data["source"] = "gemini"
        data["date"] = str(date.today())
        return data
    except Exception as e:
        d = _fallback(hint)
        d["source"] = f"fallback({type(e).__name__})"
        d["error"] = str(e)[:300]
        return d
