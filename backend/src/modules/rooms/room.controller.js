"use strict";
// src/controllers/room.controller.ts
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoomById = exports.editRoom = exports.deleteRoom = exports.getUserRooms = exports.joinSecretRoomByName = exports.joinRoom = exports.createRoom = exports.getCreatedRooms = exports.searchRooms = void 0;
exports.wrap = wrap;
const S = __importStar(require("../services/room.service"));
const error_utils_1 = require("../utils/error.utils");
// A generic wrapper that preserves handler's param typing
function wrap(fn) {
    return (req, res) => {
        return fn(req, res).catch((err) => {
            (0, error_utils_1.sendError)(res, err.status || 500, err.msg || "Server error");
        });
    };
}
exports.searchRooms = wrap(S.searchRooms);
exports.getCreatedRooms = wrap(S.getCreatedRooms);
exports.createRoom = wrap(S.createRoom);
exports.joinRoom = wrap(S.joinRoom);
exports.joinSecretRoomByName = wrap(S.joinSecretRoomByName);
exports.getUserRooms = wrap(S.getUserRooms);
exports.deleteRoom = wrap(S.deleteRoom);
exports.editRoom = wrap(S.editRoom);
exports.getRoomById = wrap(S.getRoomById);
