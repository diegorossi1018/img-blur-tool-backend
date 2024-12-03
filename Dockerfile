# Specify base image
FROM node:22

# Specify working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port 8000
EXPOSE 5000

# Run the app
CMD ["npm", "start"]