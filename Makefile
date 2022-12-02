## Run tests with jest
.PHONY: test
test:
        yarn run test

.PHONY: bot
bot:
        docker rm -f notion-telegram-bot-test && dc -f docker-compose.test.yml build && dc -f docker-compose.test.yml up -d telegram-bot && dc -f docker-compose.test.yml logs -f

.PHONY: install
install:
        yarn install