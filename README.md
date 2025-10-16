# SWEET CONTROL

> **Interactive Claw Machine System powered by Raspberry Pi 5 + Next.js + Docker**

---

## Overview

**Sweet Control** is a modular system designed to control an interactive physical setup (a claw machine).  
It uses a **Raspberry Pi 5** as the main controller (core logic), and separates each functionality into independent **Docker containers** for scalability and clean architecture.

---

## Tech Stack

| Layer                | Stack / Tools                            |
| -------------------- | ---------------------------------------- |
| **Core Logic**       | Node.js + Express                        |
| **Frontend (Web)**   | Next.js (React, Tailwind, Framer Motion) |
| **Communication**    | WebSocket (real-time updates) Soketi     |
| **Hardware Control** | Raspberry Pi GPIO                        |
| **Deployment**       | Docker + docker-compose                  |
| **Environment**      | `.env` files per service                 |

---

## System Flow

1. The **user** interacts with the joystick or controls in the web interface.
2. The **Web API** sends a request to the **Core service** (`/move` endpoint).
3. The **Core** updates the simulated motor position, controls GPIO (LEDs),  
   and emits an event to **Pusher**.
4. The **Web app** listens in real-time and animates the virtual motor.
5. Optionally, the core can control more peripherals:
   - LEDs
   - Claw motors
   - Speakers
   - Object detection sensors (camera / NFC / weight)

---

## How to Run

### 1️⃣ Clone the repository

```bash
git clone https://github.com/yourname/SweetControl-PI.git
cd SweetControl-PI
```

### 2️⃣ Configure environments

Create:

- `core/.env`
- `web/.env.local`

Example `.env`:

```bash
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=eu
```

### 3️⃣ Start Docker Compose

```bash
docker-compose up --build
```

### 4️⃣ Access services

- 🌐 Web UI → http://localhost:3000
- ⚙️ Core API → http://localhost:4000

---

## Development Notes

- Both **Core** and **Web** containers use `nodemon` for hot reload during development.
- GPIO control uses direct system commands (gpioset)
  - All pins are initialized as output and set to OFF on startup.
- Clear console logging indicates the active LED direction during operation.

---

## Directory Structure

```
sweet-control/
├─ containers/
│  ├─ motor/
│  │  └─ ledControl.js
│  ├─ objdet/
│  └─ visuals/
│
├─ core/
│  ├─ server.js
│  ├─ Dockerfile
│  └─ .env
│
├─ web/
│  ├─ src/
│  │  └─ app/
│  │     └─ motor/page.js
│  ├─ Dockerfile
│  └─ .env.local
│
├─ docker-compose.yml
├─ .dockerignore
└─ README.md
```

---

## Credits

Powered by **Raspberry Pi 5**, **Node.js**, and **Next.js**  
Modular • Scalable • Real-time

---

## Future Enhancements

- Add authentication / user sessions
- Integrate camera
- Add speaker / sound feedback container
- Mollie payments to support donations for Warmste Week, raising funds for diabetes research.
- Each donor’s name, email, and donation amount will be securely stored in a SQLite database.
- A live donation page.
