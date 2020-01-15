# build stage
FROM node:10.17 as build

RUN apt-get update && apt-get install -y libopus-dev

WORKDIR /opt/app
COPY package.json package-lock.json ./
RUN npm ci

COPY src tsconfig.json ./

RUN npm run build && \
    npm prune --production

# run stage
FROM node:10.17

RUN apt-get update && apt-get install libopus-dev -y ffmpeg

USER node
WORKDIR /opt/app

RUN mkdir /tmp/discoCache

COPY --from=build /opt/app/node_modules node_modules
COPY --from=build /opt/app/lib lib
COPY . .

ENTRYPOINT ["bin/run"]
