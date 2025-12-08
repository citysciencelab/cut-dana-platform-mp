# Create container for building mobility-frontend
FROM node:20.19.2-alpine as build

ARG BACKEND_URI=https://staging-dana-backend.elie.de
ENV BACKEND_URI=$BACKEND_URI

RUN mkdir -p /usr/app
WORKDIR /usr/app

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

COPY . ./masterportal

RUN npm i --prefix masterportal/addons/dipasAddons/dataNarrator --legacy-peer-deps
RUN npm i --prefix masterportal

RUN BACKEND_URI=$BACKEND_URI npm run elie-buildPortal --prefix masterportal

RUN ls -la /usr/app/masterportal/dist

RUN cd /usr/app/masterportal/dist && cp -r mastercode stories/

FROM nginx

COPY nginx-portal.conf /etc/nginx/conf.d/default.conf

COPY --from=build /usr/app/masterportal/dist /usr/share/nginx/html

EXPOSE 80

