# 1. Update to Node.js 22-alpine
FROM node:22-alpine

# 2. Set working directory
WORKDIR /app

# 3. Copy package files first (Caching trick)
COPY package.json package-lock.json ./

# 4. Install dependencies
RUN npm install

# 5. Copy the rest of the code
COPY . .

# 6. Build the Next.js app
RUN npm run build

# 7. Expose Port 3000
EXPOSE 3000

# 8. Start the app
CMD ["npm", "start"]
