FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

ARG FFMPEG_PATH

RUN npm install

COPY . .

ENV FFMPEG_PATH=${FFMPEG_PATH}

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]