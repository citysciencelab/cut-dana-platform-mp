FROM node:20-alpine AS build

ARG BACKEND_URI=https://staging-dana-backend.elie.de
ENV BACKEND_URI=$BACKEND_URI

RUN mkdir -p /usr/app/masterportal
WORKDIR /usr/app/masterportal

RUN apk add --no-cache git
RUN apk add --update --no-cache \
    make \
    g++ \
    jpeg-dev \
    cairo-dev \
    giflib-dev \
    pango-dev \
    libtool \
    autoconf \
    automake

COPY . .
COPY ./addons/dipasAddons/dataNarrator/addonsConf.json ./addons/addonsConf.json

RUN npm i --prefix addons/dipasAddons/dataNarrator --legacy-peer-deps
RUN npm i --prefix .

RUN BACKEND_URI=$BACKEND_URI npm run elie-buildPortal --prefix .

RUN ls -la /usr/app/masterportal/dist

RUN cd /usr/app/masterportal/dist && cp -r mastercode stories/

FROM nginx

COPY nginx-portal.conf /etc/nginx/conf.d/default.conf

COPY --from=build /usr/app/masterportal/dist /usr/share/nginx/html

EXPOSE 80

