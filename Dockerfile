# build stage
FROM node:8.11-alpine as build

RUN apk add --update make gcc g++ python

WORKDIR /opt/app
COPY package.json package-lock.json ./
RUN npm install

COPY src tsconfig.json ./

RUN npm run build && \
    npm prune --production

# run stage
FROM node:8.11-alpine

RUN apk add --update ffmpeg ca-certificates

USER node
WORKDIR /opt/app

RUN mkdir /tmp/discoCache

COPY --from=build /opt/app/node_modules node_modules
COPY --from=build /opt/app/lib lib
COPY . .

ENTRYPOINT ["bin/run"]
