"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSocketAuthMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cookie = __importStar(require("cookie"));
// The same secret used to sign your JWTs
const JWT_SECRET = process.env.JWT_SECRET;
// Registers the authentication middleware on the given socket.io instance
const registerSocketAuthMiddleware = (io, socketToUser, userSockets) => {
    io.use((socket, next) => {
        const rawCookie = socket.handshake.headers.cookie || "";
        const cookies = cookie.parse(rawCookie);
        const token = cookies.token;
        if (!token)
            return next(new Error("No token provided"));
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            const userId = decoded.id.toString();
            socket.data.userId = userId;
            socketToUser[socket.id] = userId;
            if (!userSockets[userId]) {
                userSockets[userId] = new Set();
            }
            userSockets[userId].add(socket.id);
            next();
        }
        catch (err) {
            next(new Error("Invalid token"));
        }
    });
};
exports.registerSocketAuthMiddleware = registerSocketAuthMiddleware;
