# FROM node:18-alpine
# WORKDIR /app
# COPY package*.json ./
# RUN npm install
# COPY . .
# EXPOSE 3000
# CMD ["npm", "run", "dev"]


FROM node:18-alpine
WORKDIR /app

# Cache dependencies
COPY package*.json ./
RUN npm ci || npm install

# Copy the rest of your code
COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]
