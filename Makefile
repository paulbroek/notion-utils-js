ENV_FILE=./.env.test

CONTENT_SERVICE=add-content-service
# dc='docker-compose -f docker-compose.test.yml'
COMPOSE_CONFIG=docker-compose.test.yml

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
	docker-compose -f docker-compose.test.yml logs -f telegram-bot

# .PHONY: content-service
# content-service:
# 	docker rm -f $(CONTENT_SERVICE_NAME) && docker-compose -f $(COMPOSE_CONFIG) --build -d $(CONTENT_SERVICE_NAME) && docker-compose -f $(COMPOSE_CONFIG) logs -f $(CONTENT_SERVICE_NAME)

.PHONY: content-service
content-service:
	docker rm -f $(CONTENT_SERVICE) && \
	docker-compose -f docker-compose.test.yml build && \
	docker-compose -f docker-compose.test.yml up -d $(CONTENT_SERVICE) && \
	docker-compose -f docker-compose.test.yml logs -f $(CONTENT_SERVICE)

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