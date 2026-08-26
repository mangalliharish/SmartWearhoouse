# Stage 1: Build Frontend & Backend
FROM node:22-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate

# Copy all source files (excluding .dockerignore)
COPY . .

# Install dependencies across all workspace packages
RUN pnpm install --frozen-lockfile

# Build project references, backend and frontend
RUN pnpm run build

# Seed initial database
RUN pnpm run seed

# Stage 2: Production Runtime
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

RUN corepack enable && corepack prepare pnpm@10.33.2 --activate

# Copy built application and modules
COPY --from=builder /app /app

EXPOSE 8080

CMD ["pnpm", "run", "start"]
