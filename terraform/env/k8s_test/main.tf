terraform {
  required_version = ">= 1.0.0, < 2.0.0"

  backend "s3" {
    endpoint = "ams3.digitaloceanspaces.com/"
    region   = "us-west-1" # not used since it's a DigitalOcean spaces bucket
    key      = "terraform.tfstate"
    bucket   = "kube-terraform-state-notion-utils"

    skip_credentials_validation = true
    skip_metadata_api_check     = true
  }
}

module "k8s_cluster" {
  source = "../../modules/k8s_cluster"

  do_token = var.do_token
  pvt_key  = var.pvt_key
  # NOTION_API_KEY     = var.NOTION_API_KEY
  # TELEGRAM_BOT_TOKEN = var.TELEGRAM_BOT_TOKEN
  # NOTION_DATABASE_ID = var.NOTION_DATABASE_ID
  # DATABASE_URL       = var.DATABASE_URL

}
