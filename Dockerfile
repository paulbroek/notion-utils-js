FROM node:lts-alpine
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --production --silent && mv node_modules ../
# COPY /src .
COPY . .
# RUN chown -R node /usr/src/app
# RUN chown -R node /dist/
RUN npm run build
USER node
# CMD ["node", "index.ts"]
# CMD ["node", "-r", "ts-node/register", "index.ts"]
# CMD ["node", "./dist/index.js"]
# ts-node ./dist/index.js
