# Base image
FROM node:18-alpine

# Install build tools (needed for epoll/onoff)
RUN apk add --no-cache python3 make g++ linux-headers

# Set working directory
WORKDIR /app

# Copy package files
COPY ./core/package*.json ./

# Install all dependencies (not only production)
# so epoll can rebuild properly
RUN npm install

# Copy source code
COPY ./core .
COPY ./containers ./containers

# Rebuild epoll to match the current Node version
RUN npm rebuild epoll

# Expose API port
EXPOSE 4000

# Run the app
CMD ["npm", "run", "dev"]
