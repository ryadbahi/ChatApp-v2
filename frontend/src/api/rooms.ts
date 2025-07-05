import axios from "./axios";
import type { Room, CreateRoomData } from "../types/types";

export const createRoom = async (data: CreateRoomData) => {
  const response = await axios.post("/api/rooms", data, {
    withCredentials: true,
  });
  return response.data;
};

export const getRooms = async () => {
  const response = await axios.get("/api/rooms", {
    withCredentials: true,
  });
  return response.data as Room[];
};

export const searchRooms = async (query: string) => {
  const response = await axios.get(
    `/api/rooms/search?q=${encodeURIComponent(query)}`,
    {
      withCredentials: true,
    }
  );
  return response.data as Room[];
};

export const getCreatedRooms = async () => {
  const response = await axios.get("/api/rooms/created", {
    withCredentials: true,
  });
  return response.data as Room[];
};

export const joinRoom = async (
  roomId: string,
  data: { password?: string; name?: string }
) => {
  const response = await axios.post(`/api/rooms/${roomId}/join`, data, {
    withCredentials: true,
  });
  return response.data;
};

export const editRoom = async (roomId: string, data: CreateRoomData) => {
  const response = await axios.put(`/api/rooms/${roomId}`, data, {
    withCredentials: true,
  });
  return response.data;
};

export const deleteRoom = async (roomId: string) => {
  const response = await axios.delete(`/api/rooms/${roomId}`, {
    withCredentials: true,
  });
  return response.data;
};

export const joinSecretRoomByName = async (data: {
  name: string;
  password: string;
}) => {
  const response = await axios.post("/api/rooms/secret", data, {
    withCredentials: true,
  });
  return response.data;
};
