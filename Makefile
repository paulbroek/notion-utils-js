## Run tests with jest
.PHONY: test
test:
	yarn run test

.PHONY: bot
bot:
	docker rm -f notion-telegram-bot-test &&\
		docker-compose -f docker-compose.test.yml build &&\
		docker-compose -f docker-compose.test.yml up -d telegram-bot &&\
		docker-compose -f docker-compose.test.yml logs -f

.PHONY: install
install:
	yarn install

sync_env_to_here:
	rsync -avz -e ssh $(SERVER_USER)@$(SERVER_ADDR):~/repos/notion-utils-js/.env.test ~/repos/notion-utils-js 

sync_env_to_server:
	rsync -avz -e ssh ~/repos/notion-utils-js/.env.test $(SERVER_USER)@$(SERVER_ADDR):~/repos/notion-utils-js/.env.test 