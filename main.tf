terraform {
  required_version = ">= 0.12"
  required_providers {
    digitalocean = {
      source = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

# resource "digitalocean_custom_image" "ubuntu_with_docker" {
#   name   = "ubuntu_with_docker"
#   url = "https://stable.release.flatcar-linux.net/amd64-usr/2605.7.0/flatcar_production_digitalocean_image.bin.bz2"
#   regions = ["nyc3"]
# }

resource "digitalocean_droplet" "www-1" {
    # image = "ubuntu-20-04-x64"
    image = "docker-20-04"
    name = "www-1"
    region = "nyc3"
    size = "s-1vcpu-1gb"
    ssh_keys = [
      data.digitalocean_ssh_key.terraform.id
    ]

connection {
    host = self.ipv4_address
    user = "root"
    type = "ssh"
    private_key = file(var.pvt_key)
    timeout = "2m"
  }

provisioner "remote-exec" {
    inline = [
      "export PATH=$PATH:/usr/bin",
      # clone repo
      "git clone https://github.com/paulbroek/notion-utils-js",
      "cd notion-utils.js",
      "docker-compose up -d"
    ]
  }
}