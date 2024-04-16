# Use an official Node.js runtime as the base image
FROM node:21

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install npm dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY server.js .
COPY app.js .
COPY portfolio.db .
COPY server.js .
COPY ./storage/images/*.* /usr/src/app/storage/images/
# Expose the port on which your app runs
EXPOSE 3000

# Command to run your Node.js application
CMD ["node", "server.js"]
