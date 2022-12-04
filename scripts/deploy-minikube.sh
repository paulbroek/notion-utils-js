#!/bin/bash
TMP_DIR=/tmp
cp config/deployment.yml $TMP_DIR

sed -i "s|<NOTION_API_KEY>|$NOTION_API_KEY|" $TMP_DIR/deployment.yml
sed -i "s|<TELEGRAM_BOT_TOKEN>|$TELEGRAM_BOT_TOKEN|" $TMP_DIR/deployment.yml
sed -i "s|<NOTION_DATABASE_ID>|$NOTION_DATABASE_ID|" $TMP_DIR/deployment.yml
sed -i "s|<DATABASE_URL>|$DATABASE_URL|" $TMP_DIR/deployment.yml

TAG=main && sed -i 's|<IMAGE>|ghcr.io/paulbroek/notion-utils-js:'${TAG}'|' $TMP_DIR/deployment.yml

kubectl apply -f $TMP_DIR/deployment.yml

kubectl rollout status deployment/notion-telegram-bot-js
