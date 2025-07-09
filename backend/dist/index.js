"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalSocketIO = void 0;
// src/index.ts
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const socket_io_1 = require("socket.io");
const auth_route_1 = __importDefault(require("./routes/auth.route"));
const room_route_1 = __importDefault(require("./routes/room.route"));
const message_route_1 = __importDefault(require("./routes/message.route"));
const errorHandler_1 = require("./middlewares/errorHandler");
const socket_1 = require("./socket/socket"); // 👈 socket logic separated
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "http://localhost:5173", // Frontend
        credentials: true,
    },
});
// Make socket instance globally available BEFORE setup
exports.globalSocketIO = io;
// 🧠 Setup socket logic (auth, events, etc.)
(0, socket_1.setupSocket)(io);
// ✅ Middleware
app.use((0, cors_1.default)({ origin: "http://localhost:5173", credentials: true }));
app.use(express_1.default.json({ limit: "1mb" }));
app.use((0, cookie_parser_1.default)());
// ✅ Routes
app.use("/api/auth", auth_route_1.default);
app.use("/api/rooms", room_route_1.default);
app.use("/api/messages", message_route_1.default);
// Friends routes
const friends_route_1 = __importDefault(require("./routes/friends.route"));
app.use("/api/friends", friends_route_1.default);
// Notifications routes
const notifications_route_1 = __importDefault(require("./routes/notifications.route"));
app.use("/api/notifications", notifications_route_1.default);
// Direct Messages routes
const directMessage_route_1 = __importDefault(require("./routes/directMessage.route"));
app.use("/api/direct-messages", directMessage_route_1.default);
// Image/GIF upload route
const upload_route_1 = __importDefault(require("./routes/upload.route"));
app.use("/api/upload", upload_route_1.default);
// ✅ Test route
app.get("/", (req, res) => {
    res.send("API is running");
});
// ✅ Global error handler
app.use(errorHandler_1.errorHandler);
// ✅ DB + server startup
const PORT = Number(process.env.PORT) || 5000;
const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/yourdb"; // Fallback URI
mongoose_1.default
    .connect(MONGO_URI)
    .then(() => {
    console.log("✅ MongoDB connected");
    server.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
})
    .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
});
// Handle server errors
server.on("error", (error) => {
    console.error("Server error:", error);
});
// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
    console.error("Unhandled Rejection:", err);
});
