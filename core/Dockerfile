# Base image (Debian-based, works perfectly on Raspberry Pi)
FROM node:18-bookworm

# 🧰 Install dependencies including libgpiod tools and SQLite headers
RUN apt-get update && apt-get install -y \
    python3 make g++ \
    gpiod libgpiod-dev libgpiod2 \
    libsqlite3-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first (for caching)
COPY ./core/package*.json ./

# Install Node dependencies (including better-sqlite3)
RUN npm install

# Copy the rest of the app
COPY ./core .
COPY ./containers ./containers

# Rebuild any native modules (epoll, better-sqlite3, etc.)
RUN npm rebuild || true

EXPOSE 4000
CMD ["npm", "run", "dev"]
