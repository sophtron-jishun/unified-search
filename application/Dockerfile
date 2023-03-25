FROM node:17

# Create app directory
WORKDIR /app

COPY ./ ./
#COPY ./dist ./views

ARG NPM_TOKEN  
COPY npmrc .npmrc  

RUN cat .npmrc
RUN npm install 
RUN rm -f .npmrc

RUN npm install
#COPY --from=build-frontend /app/dist ./views

ENV Env prod

EXPOSE 8080
CMD node ./index.js