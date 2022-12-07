terraform {
  required_version = ">= 1.0.0, < 2.0.0"

  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

variable "do_token" {}
variable "pvt_key" {}
# variable "ssh_key_name" {}
# variable "NOTION_API_KEY" {}
# variable "TELEGRAM_BOT_TOKEN" {}
# variable "NOTION_DATABASE_ID" {}
# variable "DATABASE_URL" {}

provider "digitalocean" {
  token = var.do_token
}

data "digitalocean_ssh_key" "terraform" {
  name = "terraform"
}

resource "digitalocean_kubernetes_cluster" "bot-cluster" {
  name   = "bot-cluster"
  region = "ams3"
  # Grab the latest version slug from `doctl kubernetes options versions`
  version = "1.25.4-do.0"

  node_pool {
    name = "worker-pool"
    # Grab instance types with `doctl compute size list`
    size       = "s-2vcpu-2gb"
    auto_scale = false
    node_count = 2
  }

  provider = digitalocean

  connection {
    host        = self.ipv4_address
    user        = "root"
    type        = "ssh"
    private_key = file(var.pvt_key)
    timeout     = "3m"
  }
}
