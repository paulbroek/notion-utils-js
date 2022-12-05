# resource "digitalocean_custom_image" "ubuntu_with_docker" {
#   name   = "ubuntu_with_docker"
#   url = "https://stable.release.flatcar-linux.net/amd64-usr/2605.7.0/flatcar_production_digitalocean_image.bin.bz2"
#   regions = ["ams3"]
# }

variable "NOTION_API_KEY" {
    type = string
    # sensitive   = true
}
variable "TELEGRAM_BOT_TOKEN" {
    type = string
    # sensitive   = true
}
variable "NOTION_DATABASE_ID" {
    type = string
    # sensitive   = true
}
variable "DATABASE_URL" {
    type = string
    # sensitive   = true
}

resource "digitalocean_droplet" "www-1" {
    image = "docker-20-04"
    # image = digitalocean_custom_image.ubuntu_with_docker.id
    name = "www-1"
    region = "ams3"
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

provisioner "remote-exec" {
    inline = [
      "export PATH=$PATH:/usr/bin",
      # clone and deploy
      "git clone -b dev https://github.com/paulbroek/notion-utils-js",
      # TODO: use `~/.yarn/bin/dotenv -e .env make sync_env_to_here` instead
      "touch /root/notion-utils-js/.env",
      "touch /root/notion-utils-js/.env.test",
      "echo \"NOTION_API_KEY=${var.NOTION_API_KEY}\" >> /root/notion-utils-js/.env.test",
      "echo \"TELEGRAM_BOT_TOKEN=${var.TELEGRAM_BOT_TOKEN}\" >> /root/notion-utils-js/.env.test",
      "echo \"NOTION_DATABASE_ID=${var.NOTION_DATABASE_ID}\" >> /root/notion-utils-js/.env.test",
      "echo \"DATABASE_URL=${var.DATABASE_URL}\" >> /root/notion-utils-js/.env.test",
      "docker compose -f /root/notion-utils-js/docker-compose.test.yml up -d telegram-bot"
    ]
  }

# provisioner "remote-exec" {
#     scripts = [
#       "/root/notion-utils-js/scripts/echo_var.sh"
#     ]
#   }
}

# resource "digitalocean_project" "notion-telegram-bot" {
#     name        = "notion-telegram-bot"
#     description = "A project to represent development resources."
#     purpose     = "Web Application"
#     environment = "Production"
#     resources   = [digitalocean_droplet.www-1.urn]
#   }