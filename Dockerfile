# Use an official Node.js runtime as the base image
FROM node:21

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install npm dependencies
RUN npm install

# Install SQLite
RUN apt-get update && apt-get install -y sqlite3

# Copy the rest of the application code to the working directory
COPY server.js .
COPY app.js .
COPY init_sqlite.sql .
COPY server.js .

# Create an empty SQLite database file
RUN touch portfolio.db

# Run SQLite3 to execute SQL script on the database file
RUN sqlite3 portfolio.db < init_sqlite.sql

# Expose the port on which your app runs
EXPOSE 3000

# Command to run your Node.js application
CMD ["node", "server.js"]
