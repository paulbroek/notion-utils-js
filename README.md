# notion-utils-js

Utility library for Notion.so

Inject contect into Notion pages using javascript.
Includes a Telegram bot for creating content by interacting with the bot.

## 0.1 Config

Create `./.env` file containing

```vim
NOTION_API_KEY=...
TELEGRAM_BOT_TOKEN=...
NOTION_PAGE_ID=...
NOTION_DATABASE_ID=...
```

And `./config/.env.test` containing

```vim
TELEGRAM_API_HASH=...
TELEGRAM_API_ID=...
TELEGRAM_CHAT_ID=...
```

After following instructions [here](https://github.com/gram-js/gramjs)

## 1.0 Install, run and inspect

```bash
docker-compose up -d --build
docker-compose logs -f
```

## 1.1 Deploy on Minikube

```bash
# kubectl create deployment notion-utils-js --image=ghcr.io/paulbroek/notion-utils-js
kubectl run notion-utils-js --image=ghcr.io/paulbroek/notion-utils-js --image-pull-policy=Never
```

## 1.2 Deploy infrastructure

```bash
cd ~/repos/notion-utils-js/infra
terraform apply -auto-approve \
    -var "do_token=${DO_PAT}" \
    -var "pvt_key=$HOME/.ssh/id_rsa" \
    -var-file="secret.tfvars"
```

assuming a file `~/repos/notion-utils-js/infra/secret.tfvars`:

```vim
# do_token="..."
# pvt_key="..."
NOTION_API_KEY="..."
TELEGRAM_BOT_TOKEN="..."
NOTION_PAGE_ID="..."
NOTION_DATABASE_ID="..."
```

## 1.3 Destroy infrastructure

```bash
cd ~/repos/notion-utils-js/infra
terraform destroy -auto-approve \
    -var "do_token=${DO_PAT}" \
    -var "pvt_key=$HOME/.ssh/id_rsa" \
    -var-file="secret.tfvars"
```

## 2.0 Testing

### 2.1 Test Telegram bot using Jest

```bash
# run all tests
yarn run test

# run individual tests
yarn jest __tests__/send_message.ts --force-exit
```
