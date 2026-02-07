# Live Bidding Platform

A real-time auction platform where users compete to place bids in the final seconds of an auction.

Live Application:
https://bid-it-all.onrender.com

---

## Overview

This application implements a real-time auction system using WebSockets and a server-authoritative state model.

The system guarantees:

- Correct handling of concurrent bids
- Server-enforced auction expiration
- Client countdown synchronized to server time
- Real-time updates across connected clients

---

## Technology Stack

Backend:
- Node.js
- Express
- Socket.IO

Frontend:
- React (Vite)

Infrastructure:
- Docker (multi-stage build)
- Render deployment

---

## Architecture

Client (React)  
→ Express REST API  
→ Socket.IO real-time layer  
→ In-memory auction engine (authoritative state)

### Backend Responsibilities

- Validates bids
- Handles race conditions
- Maintains authoritative auction state
- Broadcasts real-time updates
- Enforces auction expiration

### Frontend Responsibilities

- Displays auction grid
- Synchronizes countdown to server time
- Emits bid events
- Reflects real-time updates

---

## Concurrency Model

This implementation guarantees race-condition safety within a single Node.js instance.

Reasoning:

- Node.js runs on a single-threaded event loop.
- Bid validation and state mutation are synchronous.
- Only one bid handler executes at a time.
- The first valid bid updates the state.
- Subsequent identical bids fail validation.

Scaling Note:

To support multiple backend instances, a distributed locking mechanism (e.g., Redis atomic operations) would be required.

---

## Countdown Synchronization

To prevent client-side manipulation:

1. Server returns `serverTime`.
2. Client calculates:
   `serverOffset = serverTime - Date.now()`
3. Countdown uses:
   `endsAt - (Date.now() + serverOffset)`

Auction expiration is enforced server-side regardless of client display.

---

## Running Locally (Without Docker)

### 1. Install Backend Dependencies

cd backend
npm install




### 2. Install Frontend Dependencies
cd frontend
npm install





### 3. Run Backend
Backend runs on:
http://localhost:3000



### 4. Run Frontend

Frontend runs on:
http://localhost:5173


## Build Frontend for Production

From the frontend directory: npm run build
This generates: frontend/dist



---

## Docker

The project uses a multi-stage Docker build:

Stage 1:
- Builds the React frontend.

Stage 2:
- Installs backend dependencies.
- Serves the built frontend.
- Runs the application in production mode.

### Build Docker Image

From the root directory:docker build -t live-auction 


### Run Docker Container
docker run -p 3000:3000 live-auction
http://localhost:3000





---

## Deployment

The application is deployed on Render using Docker.

Render:
- Builds the Docker image
- Runs the container
- Exposes a public URL
- Automatically handles environment configuration

---

## Future Improvements

- Persistent database storage
- Redis-based distributed locking for horizontal scaling
- Anti-sniping logic
- Authentication system
- Bid history tracking
- Optimistic UI updates

---

## Assessment Coverage

Real-time bidding: Implemented  
Race condition handling: Implemented  
Server-synchronized countdown: Implemented  
Visual feedback: Implemented  
Docker containerization: Implemented  
Production deployment: Implemented  

---

This project demonstrates real-time architecture, server-authoritative state management, concurrency handling, and production-ready containerization.















