"""Pillow로 X용(1200x675) 명언 카드 이미지 생성. 외부 폰트/유료 API 불필요."""
from __future__ import annotations

import os
import random
from datetime import date
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 675

THEMES = [
    ((30, 41, 82), (63, 114, 175)),      # 네이비->블루
    ((76, 29, 149), (168, 85, 247)),     # 퍼플
    ((13, 71, 161), (0, 150, 136)),      # 블루->틸
    ((191, 63, 63), (232, 119, 34)),     # 선셋
    ((27, 67, 50), (64, 145, 108)),      # 포레스트
    ((33, 33, 33), (97, 97, 97)),        # 차콜
]

OUT_DIR = Path(__file__).resolve().parent.parent / "output"
OUT_DIR.mkdir(exist_ok=True)


def _font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        r"C:\Windows\Fonts\malgun.ttf",   # 맑은고딕 (Windows)
        r"C:\Windows\Fonts\malgunbd.ttf",
        "/usr/share/fonts/truetype/nanum/NanumGothic.ttf",
        "/System/Library/Fonts/AppleSDGothicNeo.ttc",
    ]
    for p in candidates:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                continue
    return ImageFont.load_default()


def _wrap(draw: ImageDraw.ImageDraw, text: str, font, max_width: int) -> list[str]:
    lines, cur = [], ""
    for ch in text:
        test = cur + ch
        if draw.textlength(test, font=font) <= max_width:
            cur = test
        else:
            if cur:
                lines.append(cur)
            cur = ch if ch != " " else ""
    if cur:
        lines.append(cur)
    # 단어 단위 2차 정리 (영문 잘림 방지)
    return lines


def make_card(quote_ko: str, quote_en: str = "", author: str = "", theme_idx: int | None = None) -> str:
    """카드 이미지 저장 후 경로 반환."""
    if theme_idx is None:
        theme_idx = random.randrange(len(THEMES))
    top, bottom = THEMES[theme_idx % len(THEMES)]

    img = Image.new("RGB", (W, H), top)
    draw = ImageDraw.Draw(img)
    # 세로 그라데이션
    for y in range(H):
        r = int(top[0] + (bottom[0] - top[0]) * y / H)
        g = int(top[1] + (bottom[1] - top[1]) * y / H)
        b = int(top[2] + (bottom[2] - top[2]) * y / H)
        draw.line([(0, y), (W, y)], fill=(r, g, b))

    # 장식 테두리
    m = 28
    draw.rounded_rectangle([m, m, W - m, H - m], radius=26, outline=(255, 255, 255, 180), width=3)

    f_ko = _font(56)
    f_en = _font(30)
    f_author = _font(30)

    max_w = W - 220
    lines = _wrap(draw, quote_ko, f_ko, max_w)
    # 너무 길면 폰트 축소
    if len(lines) > 3:
        f_ko = _font(46)
        lines = _wrap(draw, quote_ko, f_ko, max_w)
    if len(lines) > 4:
        lines = lines[:4]

    # 세로 중앙 배치 계산
    line_h = 78
    block_h = len(lines) * line_h + (70 if quote_en else 20) + 60
    y = (H - block_h) // 2 + 10

    # 큰 따옴표 장식
    f_mark = _font(60)
    draw.text((W // 2, y - 60), "***", font=f_mark, fill=(255, 255, 255), anchor="mm")

    for ln in lines:
        draw.text((W // 2, y + line_h // 2), ln, font=f_ko, fill=(255, 255, 255), anchor="mm")
        y += line_h

    if quote_en:
        y += 18
        draw.text((W // 2, y), quote_en, font=f_en, fill=(255, 255, 255), anchor="ma")
        y += 48

    y += 14
    draw.text((W // 2, y), f"- {author} -" if author else "", font=f_author, fill=(255, 235, 180), anchor="ma")

    # 하단 날짜
    f_date = _font(24)
    draw.text((W - 60, H - 56), str(date.today()), font=f_date, fill=(255, 255, 255), anchor="ra")

    fname = f"quote_{date.today().isoformat()}_{random.randint(1000, 9999)}.png"
    path = OUT_DIR / fname
    img.save(path)
    return str(path)
