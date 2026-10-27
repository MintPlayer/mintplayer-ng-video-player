# Two ways to build this image, one runtime:
#
#   CI (publish-master.yml): the `prebuilt` target COPIES the client bundle the
#   build job produced and the tests ran against, from a named build context:
#     docker build -f apps/angular-demo/Dockerfile --target prebuilt \
#       --build-context dist=dist/apps/angular-demo/browser .
#   No npm install and no nx build inside Docker, and the image is byte-for-byte
#   the tested build.
#
#   Locally, from a clean checkout: the default (last) target builds from source.
#     docker build -f apps/angular-demo/Dockerfile -t angular-demo .
#     docker run -p 4201:80 angular-demo
#     Visit http://localhost:4201

FROM nginx:stable-alpine AS runtime
LABEL org.opencontainers.image.source="https://github.com/MintPlayer/mintplayer-ng-video-player"
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

FROM runtime AS prebuilt
COPY --from=dist . /usr/share/nginx/html

# Node 24 on Debian slim: the same Node major and libc (glibc) as the Ubuntu
# runners that build and test the bundles.
FROM node:24-slim AS builder
WORKDIR /usr/local/app
COPY ./ /usr/local/app/
RUN npm ci
RUN npx nx run angular-demo:build:production

FROM runtime AS standalone
COPY --from=builder /usr/local/app/dist/apps/angular-demo/browser /usr/share/nginx/html
