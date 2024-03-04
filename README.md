# YT-Clipper
YouTubeの動画から切り抜きを作成するためのアプリケーションです。

```bash
cd packages/ytclip-proxy
docker build -f Dockerfile.base -t nginx-vod .
cd ../../
touch .env
docker compose up -d
```

## 環境変数
| 変数名 | 説明 |
| :-: | --- |
|CONTAINER_PREFIX | 指定するとコンテナ名にプレフィックスが付く | 
| DB_PASSWORD | データベースのパスワード |
