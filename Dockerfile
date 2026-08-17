FROM node:22-alpine

WORKDIR /usr/src/app

# 必要なパッケージをインストール
RUN apk add --no-cache git

# expo-cliをグローバルインストール
RUN npm install -g expo-cli @expo/ngrok

# ポートを公開
EXPOSE 8081 19000 19001 19002

CMD ["sh"]
