# Create container for building mobility-frontend
FROM node:18.18.0-alpine as build

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

RUN npm run buildPortal --prefix masterportal
RUN ls -la /usr/app/masterportal/dist
# Create container for running mobility-frontend
FROM nginx

# Copy build files from build container
COPY --from=build /usr/app/masterportal/dist/stories /usr/share/nginx/html

EXPOSE 80
