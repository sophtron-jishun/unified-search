FROM node:17

# Create app directory
WORKDIR /app

COPY ./ ./

RUN npm install
#COPY --from=build-frontend /app/dist ./views

ENV Env prod

EXPOSE 8080
CMD node ./server/index.js