FROM node:18-slim

# Install OpenSSL required by Prisma engines
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Copy source code
COPY . .

# Create dummy .env to prevent dotenv path errors in Prisma
RUN touch .env

# Generate Prisma Client
RUN npx prisma generate

EXPOSE 5000

CMD ["npm", "start"]
