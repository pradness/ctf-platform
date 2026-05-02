FROM node:20

WORKDIR /app

COPY package.json .
RUN npm install

COPY app.js .

EXPOSE 80

CMD node app.js
