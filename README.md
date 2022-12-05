# notion-utils-js

Utility library for Notion.so

Inject content into Notion database using Notion API `notionhq` with help of a Telegram bot.

## 0.1 Config

Create `./.env` file containing

```vim
NOTION_API_KEY=...
TELEGRAM_BOT_TOKEN=...
NOTION_DATABASE_ID=...
SERVER_USER=...
SERVER_ADDR=...
```

And `./config/.env.test` containing

```vim
TELEGRAM_API_HASH=...
TELEGRAM_API_ID=...
TELEGRAM_CHAT_ID=...
TELEGRAM_SESSION_KEY=...
```

After following instructions [here](https://github.com/gram-js/gramjs)

## 1.0a Install bot, run and inspect

```bash
# syncing .env.test file, update .env first with server details
~/.yarn/bin/dotenv -e .env make sync_env_to_server

docker-compose -f docker-compose.test.yml up -d telegram-bot --build
# rm and rerun in one line
# alias dc="docker-compose"
docker rm -f notion-telegram-bot-test && dc -f docker-compose.test.yml build && dc -f docker-compose.test.yml up -d telegram-bot && dc -f docker-compose.test.yml logs -f
# including db
docker-compose -f docker-compose.test.yml --env-file dbcredentials.env up -d --build
docker-compose -f docker-compose.test.yml logs -f

# for fast debugging and development
~/.yarn/bin/dotenv -e .env.test -- yarn dev
```

## 1.0b Deploy database

```bash
sudo mkdir -p /data/notion-telegram/{test,prod}
docker-compose -f docker-compose.test.yml --env-file dbcredentials.env up -d postgres
# step to reproduce db link
~/.yarn/bin/dotenv -e .env.test -- yarn prisma init --datasource-provider postgresql
# init tables
~/.yarn/bin/dotenv -e .env.test -- yarn prisma db push
# generate the client
~/.yarn/bin/dotenv -e .env.test -- yarn prisma generate
```

## 1.1 Deploy on Minikube

```bash
# kubectl create deployment notion-utils-js --image=ghcr.io/paulbroek/notion-utils-js
# not working?
# kubectl run notion-utils-js --image=ghcr.io/paulbroek/notion-utils-js --image-pull-policy=Never
~/.yarn/bin/dotenv -e .env.test -- bash scripts/deploy-minikube.sh
```

## 1.2 Deploy infrastructure

```bash
cd ~/repos/notion-utils-js/terraform
terraform apply -auto-approve \
    -var "do_token=${DO_PAT}" \
    -var "pvt_key=$HOME/.ssh/id_rsa" \
    -var-file="vars/test.tfvars"
```

assuming a file `~/repos/notion-utils-js/terraform/vars/test.tfvars`:

```vim
# do_token="..."
# pvt_key="..."
NOTION_API_KEY="..."
TELEGRAM_BOT_TOKEN="..."
NOTION_DATABASE_ID="..."
DATABASE_URL="..."
```

## 1.3 Destroy infrastructure

```bash
cd ~/repos/notion-utils-js/terraform
terraform destroy -auto-approve \
    -var "do_token=${DO_PAT}" \
    -var "pvt_key=$HOME/.ssh/id_rsa" \
    -var-file="vars/test.tfvars"
```

## 2.0 Testing

### 2.1 Test Telegram bot using Jest

```bash
# run all tests
yarn run test

# run individual tests
~/.yarn/bin/dotenv -e .env.test -- yarn jest __tests__/telegram.ts --force-exit --runInBand
```

## 3.0 Other

Automatically update help menu for bot

```bash
# docker-compose -f docker-compose.test.yml build
# or
# yarn run tsc -p .
# yarn run tsc -p . && ~/.yarn/bin/dotenv -e .env.test -- node dist/telegram/update-instructions.js
~/.yarn/bin/dotenv -e .env.test -- ts-node src/telegram/update-instructions.ts
```
