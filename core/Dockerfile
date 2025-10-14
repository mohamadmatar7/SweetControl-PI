# Base image (Debian-based, works perfectly on Raspberry Pi)
FROM node:18-bookworm

# 🧰 Install dependencies including libgpiod tools
RUN apt-get update && apt-get install -y \
    python3 make g++ \
    gpiod libgpiod-dev libgpiod2 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY ./core/package*.json ./
RUN npm install

COPY ./core .
COPY ./containers ./containers

RUN npm rebuild epoll || true

EXPOSE 4000
CMD ["npm", "run", "dev"]
