
# * Build stage
FROM node:12-alpine AS build
WORKDIR /app/
COPY ./package.json ./package.json
RUN npm install
COPY ./tsconfig.json ./tsconfig.json
COPY ./app.ts ./app.ts
COPY ./src ./src
RUN npm run build

# * Prod Stage (just build directory)
FROM node:12-alpine
WORKDIR /app/
COPY --from=build /app/build ./build
COPY ./package.json ./package.json
RUN npm install --only=prod
CMD ["node", "build/app.js"]