# Use a lightweight Node.js base image
FROM node:14-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the files
COPY . .

# Build the production-ready React files
RUN npm run build

# Install a lightweight static file server
RUN npm install -g serve

# Expose port 8080 (the default port for Cloud Run)
EXPOSE 8080

# Serve the build folder
CMD ["serve", "-s", "build", "-l", "8080"]
