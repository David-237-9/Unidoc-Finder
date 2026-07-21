# syntax=docker/dockerfile:1
FROM node:24.14.0-alpine AS dev

WORKDIR /app

ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true

RUN corepack enable

COPY --chown=node:node . .

RUN npm install

COPY --from=access-token --chown=node:node /run/secrets/UF_ACCESS_TOKEN /run/secrets/UF_ACCESS_TOKEN

RUN chmod 0400 /run/secrets/UF_ACCESS_TOKEN

USER node

CMD ["npm", "run", "index"]
