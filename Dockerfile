# FROM node:lts-alpine
FROM node:slim
ENV NODE_ENV=production
# We don't need the standalone Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --production --silent && mv node_modules ../
# RUN node ../node_modules/puppeteer/install.js

# Install Google Chrome Stable and fonts
# Note: this installs the necessary libs to make the browser work with Puppeteer.
RUN apt-get update && apt-get install gnupg wget -y && \
  wget --quiet --output-document=- https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor > /etc/apt/trusted.gpg.d/google-archive.gpg && \
  sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' && \
  apt-get update && \
  apt-get install google-chrome-stable -y --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*

RUN npm install -g npm@9.1.2

# COPY /src .
COPY . .
# RUN chown -R node /usr/src/app
# RUN chown -R node /dist/
RUN npm run build

# generate prisma client
RUN npx prisma generate

USER node
# CMD ["node", "index.ts"]
# CMD ["node", "-r", "ts-node/register", "index.ts"]
# CMD ["node", "./dist/index.js"]
# CMD ["node", "./dist/telegram-bot.js"]
