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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = exports.Friendship = exports.FriendRequest = exports.notificationsRoutes = exports.friendsRoutes = void 0;
// Social Module Exports
__exportStar(require("./friends.controller"), exports);
__exportStar(require("./notifications.controller"), exports);
var friends_route_1 = require("./friends.route");
Object.defineProperty(exports, "friendsRoutes", { enumerable: true, get: function () { return __importDefault(friends_route_1).default; } });
var notifications_route_1 = require("./notifications.route");
Object.defineProperty(exports, "notificationsRoutes", { enumerable: true, get: function () { return __importDefault(notifications_route_1).default; } });
var FriendRequest_1 = require("./FriendRequest");
Object.defineProperty(exports, "FriendRequest", { enumerable: true, get: function () { return __importDefault(FriendRequest_1).default; } });
var Friendship_1 = require("./Friendship");
Object.defineProperty(exports, "Friendship", { enumerable: true, get: function () { return __importDefault(Friendship_1).default; } });
var Notification_1 = require("./Notification");
Object.defineProperty(exports, "Notification", { enumerable: true, get: function () { return __importDefault(Notification_1).default; } });
