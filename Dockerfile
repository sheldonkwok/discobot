# build stage
FROM node:8.11-jessie as build

RUN apt-get update && \
    apt-get install -y build-essential

WORKDIR /opt/app
COPY package.json package-lock.json ./
RUN npm install

COPY src tsconfig.json ./
RUN npm run build && \
    npm prune --production 

# run stage
FROM node:8.11-jessie

RUN cd /tmp && \
    wget -q https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-64bit-static.tar.xz && \
    tar -Jxf ffmpeg-release-64bit-static.tar.xz && \
    mv ffmpeg-4.0.1-64bit-static/ffmpeg /usr/local/bin && \
    rm -rf /tmp/* && \
    mkdir /tmp/discoCache

WORKDIR /opt/app

COPY --from=build /opt/app/node_modules node_modules
COPY --from=build /opt/app/lib lib
COPY . .

ENTRYPOINT ["bin/run"]
