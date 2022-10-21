# notion-utils-js

Utility library for Notion.so

Inject contect into Notion pages using javascript.
Includes a Telegram bot for creating content by interacting with the bot.

## 1.0 Config

Create `.env` file containing

```vim
NOTION_API_KEY=...
TELEGRAM_BOT_TOKEN=...
NOTION_PAGE_ID=...
NOTION_DATABASE_ID=...
```

## 1.1 Install and run

```bash
docker-compose up -d --build
```

## 1.2 Inspect

```bash
docker-compose logs -f
```
