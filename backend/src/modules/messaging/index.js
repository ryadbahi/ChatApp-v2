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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
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
exports.DirectMessage = exports.Message = exports.directMessageRoutes = exports.messageRoutes = exports.dmController = void 0;
// Messaging Module Exports
__exportStar(require("./message.controller"), exports);
exports.dmController = __importStar(require("./directMessage.controller"));
var message_route_1 = require("./message.route");
Object.defineProperty(exports, "messageRoutes", { enumerable: true, get: function () { return __importDefault(message_route_1).default; } });
var directMessage_route_1 = require("./directMessage.route");
Object.defineProperty(exports, "directMessageRoutes", { enumerable: true, get: function () { return __importDefault(directMessage_route_1).default; } });
var Message_1 = require("./Message");
Object.defineProperty(exports, "Message", { enumerable: true, get: function () { return __importDefault(Message_1).default; } });
var DirectMessage_1 = require("./DirectMessage");
Object.defineProperty(exports, "DirectMessage", { enumerable: true, get: function () { return __importDefault(DirectMessage_1).default; } });
