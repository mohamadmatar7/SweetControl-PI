# ==============================
# 🎧 Audio Service - Debian Bookworm
# ==============================

FROM node:18-bookworm

# 🧰 Install audio and system tools
# ffmpeg → provides `ffplay`
# alsa-utils → manages ALSA sound devices
# mpg123 → lightweight mp3 player fallback
RUN apt-get update && apt-get install -y \
    ffmpeg \
    alsa-utils \
    mpg123 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy dependencies first (for better caching)
COPY package*.json ./

# Install NPM packages
RUN npm install

# Copy the rest of your source code
COPY . .

# Expose optional debug port (not required)
EXPOSE 5000

# 🪄 Set the container to use the host sound system
ENV AUDIODEV=hw:0,0
ENV NODE_ENV=development

# Start with nodemon for hot reload
CMD ["npm", "run", "dev"]
