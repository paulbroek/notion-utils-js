# variable "do_token" {}
# variable "pvt_key" {}

terraform {
  required_version = ">= 1.0.0, < 2.0.0"

  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
  alias = "env1"
}

# provider "digitalocean" {
#   config_file = "../../provider.tf"
# }

module "do_droplet" {

  source = "../../modules/droplet"

  do_token = var.do_token
  pvt_key  = var.pvt_key
  # ssh_key_name = var.ssh_key_name
  # NOTION_API_KEY     = var.NOTION_API_KEY
  # TELEGRAM_BOT_TOKEN = var.TELEGRAM_BOT_TOKEN
  # NOTION_DATABASE_ID = var.NOTION_DATABASE_ID
  # DATABASE_URL       = var.DATABASE_URL

  # providers = {
  #   digitalocean = digitalocean.env1
  # }

}

# module "k8s_cluster" {
#   source = "../../modules/k8s_cluster"
# }
