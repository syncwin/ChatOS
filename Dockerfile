# Use official Node.js 18 Alpine image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code (excluding supabase directory via .dockerignore)
COPY . .

# Build the application
RUN npm run build

# Expose port 4173 (Vite preview port)
EXPOSE 4173

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4173

# Start the application
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173"]