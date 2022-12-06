module "do_droplet" {

  source = "../../modules/droplet"

  do_token           = var.do_token
  pvt_key            = var.pvt_key
  NOTION_API_KEY     = var.NOTION_API_KEY
  TELEGRAM_BOT_TOKEN = var.TELEGRAM_BOT_TOKEN
  NOTION_DATABASE_ID = var.NOTION_DATABASE_ID
  DATABASE_URL       = var.DATABASE_URL

}
