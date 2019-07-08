FROM ubuntu:16.04

COPY . /app

WORKDIR /app

RUN apt-get update
RUN apt-get -y install curl build-essential
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -
RUN apt-get -y install nodejs libssl1.0.0 libssl-dev libcrypto++-dev
RUN apt-get -y install pkg-config libfprint-dev
RUN npm i electron
RUN HOME=~/.electron-gyp npm install fingerprint-afm31
RUN npm i
RUN cd app
RUN npm i
RUN cd ..

RUN npm run package