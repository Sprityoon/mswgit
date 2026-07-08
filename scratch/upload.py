import urllib.request

url = "https://mod-system-content-jp-mobile-nexoncdn.s3.ap-northeast-1.amazonaws.com/mcp/67/5f/7d220bac/2026/07/08/0301a71f-5b79-42bb-9ffc-d560962224cc/675f9d74-bf24-4369-8e71-77aeefea175e?X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjELT%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaDmFwLW5vcnRoZWFzdC0xIkgwRgIhAIK7hWbGJt8xgXtoCmzNKazRUtDxUTjWmI6y%2FK9qFnAnAiEAm9GxVua8HDI8oHdEeNMBI0f7%2FKzuHAEgKfVSWW7m7jcqkQUIfRABGgw0Mjg1ODUxMjg5MzUiDDvMxibaT%2FgXaXsO7CruBAEhCyUSqw5MjamNhxeD2EOEsaUENyHWoXJD9fT9sH1vT%2BAGBk7wSw2AH2%2F9YtWxw86fTbznlq5MWzfcfE6hQQQuVYePfv68nYC5AVpIg3hjtuGMsWvNkT73ATrfFxZgiK09fuu6F%2FwDYNx97VO0xZxccHUG%2FNIxKJGP4FbLlXk%2F75IunBpxD6q9StDUTrtiySqPzt7Fu6mLkjjnS27h3XsTAUFT0eGIYMn2lHwmH6V9Qzak1vapOiNOqLgYlYdDpvJvYZDT4cEzZN0sBBGg6D9xJbHBHUhWDxiaRS2l4JZeD3uBEdaEOMXH80k0FwiU32IrVoyyh7jQnJNSM6jIwkz%2B2XYzI4N%2B%2BDzH8OWdAiZlfDT4ZS4rawt9h8JWzKYy5LhpWCc%2BecDwKUFZh72%2B9Y6LAUiDAgAAUK5H0auExEQ4GMmKtUvslmLE3iCCPWIOcg3uDa2hkXAEFkhKAW8KwwGapcQ5t4yTXpTq7q7dTFA3S%2BJJXCFp9vaW8JYgz8G1K%2BaK4JpHMqD4Zz5ycOlMuLbZc0eSXEh%2B5zFyTbvLwwBTp2JRrO8HrkIOjMxil5Oeva%2FcDvHsP4uUrdgNEKt0VWL8pfC4Dax14hcX%2Bgyhjj7C5R%2FZkGArUCXmmdNG9AkIKttMTz2ndLvxZIh3%2FzjxFNmTvWVmM7vh7kFTtAV9OgFKnFVH%2FHgNDyrRzEAK5O%2FUeZsSnsRtLZ%2BM5PbspugZjcygExHi0ST5eDp11cf4oYun8T50vGgf%2F3qgFLwKwRpoJ66NUjzwH3ZlSDDhjrjMcm5WemtSPul5PB7Zo06nihAlJWrO%2BMCQaAdQGmIO770wlo%2B30gY6lwHI0ia2DQzZeovytlxdRvgFkmqUDwed3JXio29heCnrue0pIqlv1zLdQNky83cwHNixKEnrZvRRcDIIS%2BkrO2p07L3%2B26qs5%2BxuO%2FVzxKCYWf2FVWfHvpCbark9fnzjlClaK9uwx0xjYAmnJG6y9Qu10mmyP8jIg9EDC6jkVf5pIvmf3syGRCtELi%2FXM3mqrOUsGZYs3U%2Bq&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIAWHSNKCPTU4WSQ7RX%2F20260708%2Fap-northeast-1%2Fs3%2Faws4_request&X-Amz-Date=20260708T041342Z&X-Amz-SignedHeaders=content-length%3Bhost&X-Amz-Signature=c9d7801678cf5d502fd1594d6549a8fc6f2de0dc70b9870952898d984d13fc0b"

with open("scratch/house_steep_render.png", "rb") as f:
    data = f.read()

req = urllib.request.Request(url, data=data, method="PUT")
req.add_header("Content-Length", str(len(data)))

try:
    with urllib.request.urlopen(req) as response:
        print("Upload successful:", response.status)
except Exception as e:
    print("Upload failed:", e)
    if hasattr(e, 'read'):
        print(e.read().decode())
