# Build stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV REACT_APP_API_URL=/api
RUN npm run build

# Serve stage (Nginx won't be used inside this container, because we serve it from the main Nginx reverse proxy)
# Wait, actually the standard way is to serve static files from Nginx container directly by mounting volumes, or by running a lightweight web server here and proxying. 
# Let's use serve to serve the static build, and Nginx will proxy to it.
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
