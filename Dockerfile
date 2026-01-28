# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend
FROM rust:1.75-slim AS backend-builder
WORKDIR /app/backend
RUN apt-get update && apt-get install -y pkg-config libssl-dev
COPY backend/Cargo.toml backend/Cargo.lock ./
# Create a dummy main.rs to build dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -f target/release/deps/gemini_drafting_backend*
COPY backend/src ./src
RUN cargo build --release

# Stage 3: Runtime
FROM debian:bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=backend-builder /app/backend/target/release/gemini-drafting-backend ./backend-server
COPY --from=frontend-builder /app/frontend/dist ./dist

# Create necessary directories
RUN mkdir -p storage

EXPOSE 3000

# Copy initial config if needed, or rely on defaults
# COPY backend/config.json .

CMD ["./backend-server"]
