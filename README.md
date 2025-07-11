# AuraRooms

A modern, full-stack real-time chat application with advanced features, robust security, and a beautiful UI. Built with React, Vite, TypeScript, Node.js, Express, MongoDB, Socket.IO, and Cloudinary.

---

## Project Overview

AuraRooms is a feature-rich chat platform supporting public, private, and secret rooms, direct messaging, rich media, and robust security. The app is designed for scalability, modern UI/UX, and developer productivity.

---

## Feature Matrix

| Feature                            | Status         | Details                    |
| ---------------------------------- | -------------- | -------------------------- |
| JWT Authentication                 | ✅ Implemented | Secure, HTTP-only cookies  |
| Registration/Login                 | ✅ Implemented | Validation, error feedback |
| Profile Management                 | ✅ Implemented | Username, avatar upload    |
| Password Hashing                   | ✅ Implemented | bcryptjs                   |
| Rate Limiting                      | ✅ Implemented | express-rate-limit         |
| Inactivity Timeout                 | ✅ Implemented | Auto disconnect, warning   |
| Room Types (Public/Private/Secret) | ✅ Implemented | Secret rooms require code  |
| Room CRUD                          | ✅ Implemented | Only owner can edit/delete |
| Room User List                     | ✅ Implemented | Real-time, avatars         |
| Room Search                        | ✅ Implemented | By name                    |
| Real-time Messaging                | ✅ Implemented | Socket.IO                  |
| Rich Text                          | ✅ Implemented | TextEdit, Color            |
| Image Upload                       | ✅ Implemented | Cloudinary                 |
| GIF Picker                         | ✅ Implemented | Tenor API                  |
| Message History                    | ✅ Implemented | MongoDB                    |
| Message Timestamps                 | ✅ Implemented | Relative/absolute          |
| Direct Messaging (DMs)             | ✅ Implemented | Real-time, "seen" status   |
| Notification Pills                 | ✅ Implemented | DM notifications           |
| Responsive UI                      | ✅ Implemented | Mobile/tablet/desktop      |
| Dark/Light Mode                    | ✅ Implemented | Toggle                     |
| Accessibility                      | ✅ Implemented | Keyboard, ARIA             |
| Toast Notifications                | ✅ Implemented | Errors, joins, leaves      |
| Color Pickers                      | ✅ Implemented | Messages, rooms            |
| User Avatars                       | ✅ Implemented | Fallback/upload            |
| Profile Page                       | ✅ Implemented | View/edit info             |
| 404 Not Found Page                 | ✅ Implemented | I Guess ?                  |
| Typing Indicators                  | ❌ Not Yet     | Planned                    |
| Message Read Receipts (per room)   | ❌ Not Yet     | Planned                    |
| Advanced Admin Features            | ❌ Not Yet     | Planned                    |
| Mobile PWA                         | ❌ Not Yet     | Planned                    |
| Advanced Notification System       | ❌ Not Yet     | Planned                    |
| Dark/Light Mode                    | ❌ Not Yet     | Planned                    |

---

## Screenshots & Demo

<!-- Add screenshots or demo GIFs here -->

---

## API & Socket Events

### REST API

- `/api/auth/register` - Register new user
- `/api/auth/login` - Login
- `/api/auth/profile` - Get/update profile
- `/api/rooms` - Room CRUD
- `/api/messages/:roomId` - Get messages for room
- `/api/upload` - Image upload

### Socket Events

- `joinRoom`, `leaveRoom`, `roomUsersUpdate` - Room presence
- `sendMessage`, `receiveMessage` - Messaging
- `directMessage`, `dmSeen` - Direct messaging
- `notification` - Notifications

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
git clone https://github.com/ryadbahi/ChatApp-v2.git
cd ChatApp-v2
# Install backend
cd backend && npm install
# Install frontend
cd ../frontend && npm install
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
cd backend && npm run dev
# Start frontend (in another terminal)
cd frontend && npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5001

---

## Notes & Recommendations

- Never commit your .env files or secrets.
- Use HTTPS in production.
- Review Cloudinary and Tenor usage limits.
- For production, set secure cookies and CORS origins.
- You can extend with DMs, notifications, or more integrations.

---

## Roadmap & Contribution

- [ ] Typing indicators
- [ ] Message read receipts (per room)
- [ ] Advanced admin features
- [ ] Mobile PWA
- [ ] Advanced notification system

Contributions welcome! Please open issues or pull requests for suggestions and improvements.

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

This project is licensed under the [MIT License](./LICENSE).
