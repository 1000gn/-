"""X(Twitter) API v2 + media v1.1 업로드."""
from __future__ import annotations


def post_tweet(text: str, image_path: str | None, api_key: str, api_secret: str,
               access_token: str, access_secret: str) -> dict:
    """트윗 발행. 성공 시 {'id':..., 'url':...} 반환, 실패 시 예외."""
    import tweepy

    if not all([api_key, api_secret, access_token, access_secret]):
        raise RuntimeError("X API 키 4종이 모두 필요합니다. 사이드바에 입력해주세요.")

    if len(text) > 280:
        text = text[:277] + "..."

    client = tweepy.Client(
        consumer_key=api_key,
        consumer_secret=api_secret,
        access_token=access_token,
        access_token_secret=access_secret,
    )
    media_ids = None
    if image_path:
        api_v1 = tweepy.API(
            tweepy.OAuth1UserHandler(api_key, api_secret, access_token, access_secret)
        )
        media = api_v1.media_upload(filename=image_path)
        media_ids = [media.media_id]

    resp = client.create_tweet(text=text, media_ids=media_ids)
    tid = resp.data["id"]
    # 사용자명 없이도 열리는 URL 형태
    return {"id": tid, "url": f"https://x.com/i/status/{tid}"}


def verify_credentials(api_key: str, api_secret: str, access_token: str, access_secret: str) -> str:
    """키 유효성 검사. 성공 시 @스크린네임 반환."""
    import tweepy

    auth = tweepy.OAuth1UserHandler(api_key, api_secret, access_token, access_secret)
    api_v1 = tweepy.API(auth)
    me = api_v1.verify_credentials()
    return f"@{me.screen_name}"
