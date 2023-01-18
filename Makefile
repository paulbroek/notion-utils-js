ENV_FILE=./.env.test

.PHONY: install
install:
	yarn install
	
.PHONY: test
test:
	~/.yarn/bin/dotenv -e $(ENV_FILE) -- yarn jest __tests__/telegram.ts --force-exit --runInBand
	# yarn run test

.PHONY: bot
bot:
	docker rm -f notion-telegram-bot-test && \
	docker-compose -f docker-compose.test.yml build && \
	docker-compose -f docker-compose.test.yml up -d telegram-bot && \
	docker-compose -f docker-compose.test.yml logs -f

.PHONY: logs
logs: 
	docker logs notion-telegram-bot-test -f 
	
.PHONY: clean
clean: 
	docker rm -f notion-telegram-bot-test

sync_env_to_here:
	rsync -avz -e ssh $(SERVER_USER)@$(SERVER_ADDR):~/repos/notion-utils-js/.env.test ~/repos/notion-utils-js 

sync_env_to_server:
	rsync -avz -e ssh ~/repos/notion-utils-js/.env.test $(SERVER_USER)@$(SERVER_ADDR):~/repos/notion-utils-js/.env.test 