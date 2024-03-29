# build stage
FROM node:18 as build

RUN apt-get update && apt-get install -y libopus-dev

WORKDIR /opt/app
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src src 


RUN npm run build && \
    npm prune --production

# run stage
FROM node:18

RUN apt-get update && apt-get install -y libopus-dev ffmpeg 

USER node
WORKDIR /opt/app

RUN mkdir /tmp/discoCache

COPY --from=build /opt/app/node_modules node_modules
COPY --from=build /opt/app/dist dist
COPY . .

ENTRYPOINT ["node", "dist/app.js"]
