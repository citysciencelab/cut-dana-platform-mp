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

# Replace production URL as per custom-build.sh
# RUN node masterportal/elie/devtools/tasks/replaceProductionURL.js

# Use elie-buildPortal instead of buildPortal
RUN npm run elie-buildPortal --prefix masterportal
RUN ls -la /usr/app/masterportal/dist

# Replicate custom-build.sh step: copy mastercode into stories directory
RUN cd /usr/app/masterportal/dist && cp -r mastercode stories/

# Create container for running mobility-frontend
FROM nginx

# Copy custom nginx configuration
COPY nginx-portal.conf /etc/nginx/conf.d/default.conf

# Copy build files from build container
COPY --from=build /usr/app/masterportal/dist/stories /usr/share/nginx/html

EXPOSE 80

