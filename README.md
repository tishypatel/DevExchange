🛡️ DevExchange - Engineering Knowledge Platform

DevExchange is an internal ticketing and knowledge-sharing platform designed for engineering teams. It replaces chaotic Slack threads with structured, searchable discussions, featuring Role-Based Access Control (RBAC) and real-time collaboration.

🚀 Features

🔐 Security & RBAC

Role-Based Access: Distinct permissions for Admin, Manager, and User.

JWT Authentication: Secure login session management.

Admin Console: Bulk user management and system oversight.

📋 Ticket Management (Kanban)

Interactive Kanban Board: Filter-based board views with smooth animations.

Filtering & Sorting: Filter by Priority (Critical, High, Medium) or Status.

Rich Statuses: Track issues from "Open" to "Solved".

💬 Real-Time Collaboration

Live Threads: Comments update instantly across all open windows using WebSockets.

Notification Center: Get alerted immediately when someone replies to your ticket.

File Attachments: Upload screenshots to provide context.

🎨 Modern UI/UX

Dark Mode: Fully supported system-wide dark mode with a dedicated toggle.

Responsive Design: Works on Mobile, Tablet, and Desktop.

Animations: Smooth layout transitions using Framer Motion.

🛠️ Tech Stack

Frontend: Next.js 14 (App Router), Tailwind CSS v4, Framer Motion, Lucide Icons.

Backend: FastAPI, SQLModel (SQLite), WebSockets, Python-Jose.

DevOps: Docker ready (optional).

⚡ Getting Started

1. Clone the repository

git clone [https://github.com/YOUR_USERNAME/devexchange.git](https://github.com/YOUR_USERNAME/devexchange.git)
cd devexchange

2. Backend Setup

cd backend

# Create virtual environment

python -m venv rbac_env
source rbac_env/bin/activate # Windows: rbac_env\Scripts\activate

# Install dependencies

pip install fastapi uvicorn sqlmodel python-jose[cryptography] passlib python-multipart faker

# Seed Database (Creates 100+ dummy tickets & users)

python seed_data.py

# Run Server

uvicorn main:app --reload

Backend runs on: http://localhost:8000

3. Frontend Setup

Open a new terminal.

cd frontend

# Install packages

npm install

# Run Dev Server

npm run dev

Frontend runs on: http://localhost:3000

🔑 Default Credentials (Seeded)

Admin: boss / 123

User: intern / 123

📸 Screenshots

(You can upload screenshots to your repo's 'public' folder and link them here later)

Made with 💛 in India.
