# -------- Stage 1: Build Frontend --------
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend .
RUN npm run build


# -------- Stage 2: Backend --------
FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./backend/
RUN cd backend && npm install

COPY backend ./backend

# Copy built frontend from stage 1
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

WORKDIR /app/backend

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "server.js"]
