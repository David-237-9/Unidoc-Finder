FROM node:18-alpine

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose React dev server port
EXPOSE 3000

# Start dev server
CMD ["npm", "start"]