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

# to switch easily between DO accounts
# provider "digitalocean" {
#   token = var.do_token
#   alias = "env2"
# }

variable "do_token" {}
variable "pvt_key" {}

data "digitalocean_ssh_key" "terraform" {
  name = "terraform"
}

# module "droplet" {
#   source = "./modules/droplet"

#   providers = {
#     digitalocean = digitalocean.env1
#   }
# }

# module "k8s_cluster" {
#   source = "./modules/k8s_cluster"

#   providers = {
#     digitalocean = digitalocean.env1
#   }
# }

module "terraform_test_module" {

  source = "./env/test"

  # providers = {
  #   digitalocean = digitalocean.env1
  # }
}
