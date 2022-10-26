# resource "digitalocean_custom_image" "ubuntu_with_docker" {
#   name   = "ubuntu_with_docker"
#   url = "https://stable.release.flatcar-linux.net/amd64-usr/2605.7.0/flatcar_production_digitalocean_image.bin.bz2"
#   regions = ["nyc3"]
# }

variable "NOTION_API_KEY" {
    type = string
}
variable "TELEGRAM_BOT_TOKEN" {
    type = string
}
variable "NOTION_PAGE_ID" {
    type = string
}
variable "NOTION_DATABASE_ID" {
    type = string
}

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
    timeout = "3m"
  }

# NOTION_DATABASE_ID=var.NOTION_DATABASE_ID

provisioner "remote-exec" {
    inline = [
      "export PATH=$PATH:/usr/bin",
      # clone and deploy
      "git clone -b dev https://github.com/paulbroek/notion-utils-js",
      # ugly?
      "echo \"export NOTION_API_KEY=${var.NOTION_API_KEY}\" >> ~/.bashrc",
      "echo \"export TELEGRAM_BOT_TOKEN=${var.TELEGRAM_BOT_TOKEN}\" >> ~/.bashrc",
      "echo \"export NOTION_PAGE_ID=${var.NOTION_PAGE_ID}\" >> ~/.bashrc",
      "echo \"export NOTION_DATABASE_ID=${var.NOTION_DATABASE_ID}\" >> ~/.bashrc",
      # "source ~/.bashrc",
      # "docker-compose -f /notion-utils-js/docker-compose.yml up -d"
    ]
  }

provisioner "remote-exec" {
    scripts = [
      "./notion-utils-js/scripts/start.sh"
    ]
  }
}

# resource "digitalocean_project" "notion-telegram-bot" {
#     name        = "notion-telegram-bot"
#     description = "A project to represent development resources."
#     purpose     = "Web Application"
#     environment = "Production"
#     resources   = [digitalocean_droplet.www-1.urn]
#   }