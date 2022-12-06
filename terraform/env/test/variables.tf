variable "NOTION_API_KEY" {
  type      = string
  sensitive = true
}

variable "TELEGRAM_BOT_TOKEN" {
  type      = string
  sensitive = true
}

variable "NOTION_DATABASE_ID" {
  type      = string
  sensitive = true
}

variable "DATABASE_URL" {
  type      = string
  sensitive = true
}

variable "CLUSTER_NAME" {
  type      = string
  sensitive = false
}

variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "pvt_key" {
  description = "SSH private key"
  type        = string
  sensitive   = true
}

# variable "ssh_key_name" {
#   description = "SSH key name"
#   type        = string
#   sensitive   = true
# }
