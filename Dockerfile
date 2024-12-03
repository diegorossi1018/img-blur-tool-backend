# Specify base image
FROM node:22

# Specify working directory
WORKDIR /test_extension_server

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port 8000
EXPOSE 4000

# Run the app
CMD ["npm", "start"]