variable "do_token" {}
variable "pvt_key" {}

terraform {
  required_version = ">= 1.0.0, < 2.0.0"

  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

# provider "digitalocean" {
#   token = var.do_token
#   alias = "env1"
# }

provider "digitalocean" {
  config_file = "../../provider.tf"
}

module "terraform_test_module" {

  source = "../../modules/droplet"

  providers = {
    digitalocean = digitalocean.env1
  }

}

# module "k8s_cluster" {
#   source = "../../modules/k8s_cluster"
# }
