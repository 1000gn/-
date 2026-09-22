"""X 명언 자동발행기 — 웹 대시보드 (Streamlit).
실행: streamlit run app.py
"""
from __future__ import annotations

import os
from datetime import datetime

import streamlit as st
from dotenv import load_dotenv

from core.image_maker import make_card
from core.quotes import generate_quote
from core.store import add_post, last_post_date, load_posts, load_settings, save_settings
from core.x_post import post_tweet, verify_credentials

load_dotenv()

st.set_page_config(page_title="X 명언 자동발행기", page_icon="💪", layout="wide")
st.title("💪 X 명언 자동발행기")
st.caption("Gemini 무료로 명언 생성 → 카드 이미지 합성 → 미리보기 후 X 자동업로드 (이틀 간격 · 주 4회)")

WEEKDAY_NAMES = ["월", "화", "수", "목", "금", "토", "일"]

# ---------- 사이드바 ----------
with st.sidebar:
    st.header("🔑 API 키")
    gemini_key = st.text_input("GEMINI_API_KEY", value=os.getenv("GEMINI_API_KEY", ""), type="password",
                               help="https://aistudio.google.com 에서 무료 발급. 비워두면 내장 명언으로 동작")
    st.divider()
    st.subheader("𝕏 API 키 (developer.x.com)")
    x_key = st.text_input("API Key", value=os.getenv("X_API_KEY", ""), type="password")
    x_secret = st.text_input("API Secret", value=os.getenv("X_API_SECRET", ""), type="password")
    x_token = st.text_input("Access Token", value=os.getenv("X_ACCESS_TOKEN", ""), type="password")
    x_token_secret = st.text_input("Access Secret", value=os.getenv("X_ACCESS_SECRET", ""), type="password")
    if st.button("연결 테스트"):
        try:
            who = verify_credentials(x_key, x_secret, x_token, x_token_secret)
            st.success(f"연결 성공! {who}")
        except Exception as e:
            st.error(f"실패: {e}")

    st.divider()
    st.header("🗓️ 자동 발행 스케줄")
    s = load_settings()
    weekdays = st.multiselect("발행 요일 (주4회 권장)", options=list(range(7)),
                              default=s["weekdays"], format_func=lambda i: WEEKDAY_NAMES[i])
    col1, col2 = st.columns(2)
    hour = col1.number_input("시", 0, 23, s["hour"])
    minute = col2.number_input("분", 0, 59, s["minute"])
    hint = st.text_input("명언 주제 힌트", value=s.get("hint", "꾸준함·습관"))
    auto_mode = st.toggle("자동 모드 (이 시간에 자동발행)", value=s.get("auto_mode", False))
    if st.button("스케줄 저장"):
        save_settings({"weekdays": sorted(weekdays), "hour": hour, "minute": minute,
                       "auto_mode": auto_mode, "hint": hint})
        st.success("저장됨! auto_post.py가 이 설정을 읽어 자동 발행합니다.")

    st.info(f"마지막 발행: {last_post_date() or '없음'}\n\nX 무료 요금제는 월 500건 쓰기 가능 → 주4회(월 ~16건)면 충분합니다.")

# ---------- 메인: 생성 ----------
st.subheader("1️⃣ 새 글 생성")
if st.button("✨ 명언 + 이미지 생성", type="primary"):
    with st.spinner("Gemini가 명언을 짓는 중..."):
        data = generate_quote(gemini_key, hint)
        img_path = make_card(data["quote_ko"], data.get("quote_en", ""), data.get("author", ""))
        st.session_state["draft"] = {**data, "image_path": img_path}
    st.success(f"생성 완료 (출처: {st.session_state['draft'].get('source')})")

draft = st.session_state.get("draft")
if draft:
    st.subheader("2️⃣ 미리보기 (X 게시 형태)")
    c1, c2 = st.columns([1, 1])
    with c1:
        st.image(draft["image_path"], caption="첨부 이미지 (1200×675)")
    with c2:
        tweet_text = st.text_area("트윗 본문 (수정 가능, 280자 이내)", value=draft["tweet"], height=220, max_chars=280)
        st.write(f"글자수: **{len(tweet_text)}** / 280")
        st.write(f"“{draft['quote_ko']}” — {draft.get('author','')}")
        if draft.get("error"):
            st.warning(f"폴백 동작 중: {draft['error']}")

    st.subheader("3️⃣ 발행")
    col_a, col_b = st.columns(2)
    with col_a:
        if st.button("🚀 X에 발행하기", type="primary"):
            try:
                with st.spinner("X에 업로드 중..."):
                    res = post_tweet(tweet_text, draft["image_path"], x_key, x_secret, x_token, x_token_secret)
                add_post({"tweet": tweet_text, "image": draft["image_path"],
                          "url": res["url"], "id": res["id"], "status": "posted"})
                st.success(f"발행 완료! {res['url']}")
                st.link_button("X에서 확인", res["url"])
                del st.session_state["draft"]
            except Exception as e:
                st.error(f"발행 실패: {e}")
                st.caption("흔한 원인: ① App 권한이 Read-only → Developer Portal에서 Read and Write로 변경 후 토큰 재발급 ② 무료 플랜 한도 초과 ③ 키 오타")
    with col_b:
        if st.button("🗑️ 버리고 다시 생성"):
            del st.session_state["draft"]
            st.rerun()

st.divider()
st.subheader("📚 발행 히스토리")
posts = load_posts()
if not posts:
    st.caption("아직 발행 기록이 없습니다.")
else:
    for p in posts[:20]:
        with st.expander(f"{p.get('logged_at','')} — {(p.get('tweet','')[:40])}"):
            st.write(p.get("tweet", ""))
            if p.get("url"):
                st.link_button("X에서 보기", p["url"])
            if p.get("image") and os.path.exists(p["image"]):
                st.image(p["image"], width=400)

st.divider()
with st.expander("❓ X API 키 발급 방법 (최초 1회, 약 10분)"):
    st.markdown("""
1. https://developer.x.com → 개발자 계정으로 로그인 → **Create Project/App** 생성
2. App 설정 → **User authentication settings** → OAuth 1.0a 켜기, App permissions를 **Read and Write** 로
3. **Keys and tokens** 탭에서 API Key/Secret, Access Token/Secret 발급 (Access Token은 Read and Write로 생성)
4. 왼쪽 사이드바에 4개 키 입력 → **연결 테스트** → 성공하면 끝!
5. 매월 무료 500건 쓰기 제공 → 주4회 자동발행에 충분합니다.
""")
with st.expander("⏰ 완전 자동화 방법 (PC 켜져 있을 때)"):
    st.markdown("""
- **방법 A (추천):** 윈도우 작업 스케줄러에 1시간마다 실행 등록:
  `python auto_post.py --once`
- **방법 B:** 터미널에서 상시 실행: `python auto_post.py --loop`
- 스케줄(요일·시간)은 사이드바에서 저장한 값이 `data/settings.json`에 저장되어 자동 적용됩니다.
""")
st.caption(f"현재 시각: {datetime.now():%Y-%m-%d %H:%M}")
