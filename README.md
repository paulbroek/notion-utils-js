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

## 1.3 Deploy on Minikube

```bash
# kubectl create deployment notion-utils-js --image=ghcr.io/paulbroek/notion-utils-js
kubectl run notion-utils-js --image=ghcr.io/paulbroek/notion-utils-js --image-pull-policy=Never
```

## 1.4 Deploy with infrastructure (terraform)

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

## 1.5 Destroy infrastructure (terraform)

```bash
cd ~/repos/notion-utils-js/infra
terraform destroy -auto-approve \
    -var "do_token=${DO_PAT}" \
    -var "pvt_key=$HOME/.ssh/id_rsa" \
    -var-file="secret.tfvars"
```
