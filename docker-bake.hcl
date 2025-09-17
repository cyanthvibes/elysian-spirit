group "dev" {
    targets = ["elysian-spirit-bot-dev"]
}

group "prod" {
  targets =  ["elysian-spirit-bot-prod"]
}

target "elysian-spirit-bot-dev" {
  context = "."
  dockerfile = "Dockerfile.dev"
  tags = ["elysian-spirit-bot-development:latest"]
  output = ["type=docker"]
}

target "elysian-spirit-bot-prod" {
  context = "."
  dockerfile = "Dockerfile"
  tags = ["elysian-spirit-bot-production:latest"]
  output = ["type=docker"]
}

