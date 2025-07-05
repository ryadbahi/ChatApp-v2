// src/controllers/room.controller.ts

import { Request, Response, RequestHandler } from "express";
import * as S from "../services/room.service";
import { sendError } from "../utils/error.utils";

// A generic wrapper that preserves handler's param typing
export function wrap<Params = {}, ResBody = any, ReqBody = any, ReqQuery = any>(
  fn: (
    req: Request<Params, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>
  ) => Promise<void>
): RequestHandler<Params, ResBody, ReqBody, ReqQuery> {
  return (req, res) => {
    return fn(req as any, res).catch((err) => {
      sendError(res, err.status || 500, err.msg || "Server error");
    });
  };
}

export const searchRooms = wrap(S.searchRooms);
export const getCreatedRooms = wrap(S.getCreatedRooms);
export const createRoom = wrap(S.createRoom);
export const joinRoom = wrap(S.joinRoom);
export const joinSecretRoomByName = wrap(S.joinSecretRoomByName);
export const getUserRooms = wrap(S.getUserRooms);
export const deleteRoom = wrap(S.deleteRoom);
export const editRoom = wrap(S.editRoom);
