"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = void 0;
const sendError = (res, status, msg) => {
    res.status(status).json({ msg });
};
exports.sendError = sendError;
