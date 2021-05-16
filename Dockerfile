# HFX2.0 Dockerfile
FROM node:stretch-slim

## Container
MAINTAINER Lrrr <lrrr@hackforums.net>
WORKDIR /app
VOLUME /app
COPY . .

## Update apt
RUN apt update

## Install Requirements
### *(apt doesn't deal with cli installs, so we use apt-get to install)*
RUN apt-get install -y yarn
RUN npm install -g commitizen standard-version
RUN yarn global add gulp

## Copy WD
RUN commitizen init cz-conventional-changelog --save-dev --save-exact

## Install dependencies
RUN yarn
RUN gulp build
