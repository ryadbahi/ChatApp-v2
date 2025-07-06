# AuraRooms (WORK IN PROGRESS)

A modern, full-stack real-time chat application with advanced features, robust security, and a beautiful UI. Built with React, Vite, TypeScript, Node.js, Express, MongoDB, Socket.IO, and Cloudinary.

---

## Features

### Authentication & User Management

- **JWT-based authentication**: Secure access and refresh tokens stored in HTTP-only cookies for maximum security.
- **Registration & Login**: Robust validation, error feedback, and prevention of duplicate accounts.
- **Profile management**: Users can update their username, avatar (with upload), and other profile details.
- **Password hashing**: All passwords are hashed using bcryptjs before storage.
- **Rate limiting**: Auth endpoints are protected from brute-force attacks with express-rate-limit.
- **Session management**: Automatic logout on token expiry, and refresh token rotation for added safety.
- **Inactivity timeout system**: Users are automatically disconnected after a period of inactivity (no meaningful actions like joining rooms or sending messages). A warning is shown before disconnection with a "Stay Connected" button to extend the session.
- **Message bubble effects** (3D, gradients, shadows, etc.)

### Chat Rooms

- **Room types**: Public (open to all), Private (invite only), and Secret (hidden, join via code).
- **Room creation, editing, and deletion**: Only authorized users (owners/admins) can manage rooms.
- **Join/leave rooms**: Users can join/leave rooms, and secret rooms require an invite code.
- **Room user list**: See a real-time list of users in each room, with avatars and online status.
- **Room search**: Search rooms by name, type, or other metadata.
- **Room avatars and color themes**: Each room can have a custom avatar and color theme for easy identification.

### Messaging

- **Real-time messaging**: Powered by Socket.IO for instant delivery and updates.
- **Rich text messages**: Supports bold, italic, underline, color, and emoji (with emoji-picker-react).
- **Image upload**: Users can upload images (drag & drop, paste, or file picker), stored securely on Cloudinary.
- **GIF picker**: Integrated Tenor GIF search and picker (via gif-picker-react) for fun, expressive chats.
- **Message history**: All messages are persisted in MongoDB and loaded on room join.
- **Message timestamps**: Relative and absolute timestamps, with hover/click to reveal details.
- **Typing indicators**: See when other users are typing in real time.
- **Message read receipts**: Optional per room, shows who has read each message.
- **Message bubble effects**: Modern 3D, gradient, and shadow effects for a beautiful chat experience.
- **Direct messaging** (WORK IN PROGRESS): Private one-on-one conversations between users with real-time delivery, read receipts, and message history. Users can search for other users and start direct conversations.

### UI/UX

- **Responsive design** (mobile, tablet, desktop)
- **Dark/light mode**
- **Modern, animated UI** (beautiful gradients, transitions, and effects)
- **Accessible** (keyboard navigation, ARIA labels, color contrast)
- **Toast notifications** (for errors, joins, leaves, etc.)
- **Custom color pickers** for message text and room themes
- **Emoji picker** (emoji-picker-react)
- **User avatars** (with fallback and upload)
- **Profile page** (view and edit your info)
- **404 Not Found page**

### Security

- **JWT in HTTP-only cookies** (prevents XSS token theft)
- **Password hashing** (bcryptjs)
- **Rate limiting** (express-rate-limit)
- **Input validation & sanitization** (server and client)
- **CORS** (only allows frontend origin)
- **File upload validation** (type, size, and Cloudinary security)
- **Error handling middleware** (prevents leaking stack traces)
- **Environment variables** for all secrets and API keys
- **No secrets in client code or git**
- **Strict permissions** (only room owners can edit/delete, only members can send messages)
- **Socket authentication** (token required for all socket events)
- **No open endpoints** (all routes protected as needed)

### DevOps & Quality

- **TypeScript everywhere** (frontend & backend)
- **ESLint & Prettier** (consistent code style)
- **Vite** (fast dev/build)
- **Hot reload** (frontend and backend)
- **Modular, scalable codebase** (clear separation of concerns)
- **.env files** for config (never commit secrets)
- **Production-ready build scripts**

---

## Project Structure

```
AuraRooms/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── index.ts
│   │   └── socket.ts
│   ├── package.json
│   └── ...
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── ...
└── README.md
```

---

## Setup & Running

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Cloudinary account (for image uploads)
- Tenor API key (for GIFs)

### 1. Clone & Install

```bash
# Clone the repo
$ git clone <repo-url>
$ cd ChatApp-v2

# Install backend
$ cd backend && npm install

# Install frontend
$ cd ../frontend && npm install
```

### 2. Environment Variables

Create `.env` files in both `backend/` and `frontend/`:

**backend/.env**

```
PORT=5000
MONGODB_URI=your-mongodb-uri
JWT_SECRET=your-jwt-secret
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
```

**frontend/.env**

```
VITE_TENOR_API_KEY=your-tenor-api-key
```

### 3. Run the App

```bash
# Start backend
$ cd backend && npm run dev

# Start frontend (in another terminal)
$ cd frontend && npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

---

## Notes & Recommendations

- **Never commit your .env files or secrets.**
- **Use HTTPS in production.**
- **Review Cloudinary and Tenor usage limits.**
- **For production, set secure cookies and CORS origins.**
- **You can extend with DMs, notifications, or more integrations.**

---

## Credits

- UI/UX: Tailwind CSS, React Icons, Framer Motion
- GIFs: Tenor (via gif-picker-react)
- Emojis: emoji-picker-react
- Images: Cloudinary
- Real-time: Socket.IO
- Backend: Express, Mongoose
- Frontend: React, Vite, TypeScript

---

## License

MIT (or your chosen license)
