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

RUN if [ -f ./masterportal/mp.env ]; then \
        echo "Loading environment variables from mp.env"; \
        set -a && . ./masterportal/mp.env && set +a && \
    else \
        echo "mp.env file not found, using default environment variables"; \
    fi

RUN npm i --prefix masterportal/addons/dipasAddons/dataNarrator --legacy-peer-deps
RUN npm i --prefix masterportal

RUN npm run elie-buildPortal --prefix masterportal
RUN ls -la /usr/app/masterportal/dist

RUN cd /usr/app/masterportal/dist && cp -r mastercode stories/

FROM nginx

COPY nginx-portal.conf /etc/nginx/conf.d/default.conf

COPY --from=build /usr/app/masterportal/dist /usr/share/nginx/html

EXPOSE 80

