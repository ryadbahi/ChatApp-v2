import axios from "./axios";
import type { Notification } from "../types/types";

export interface NotificationApiResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export interface NotificationsListResponse extends NotificationApiResponse {
  data?: Notification[];
}

export interface UnreadCountResponse extends NotificationApiResponse {
  data?: { count: number };
}

// Get user's notifications
export const getNotifications =
  async (): Promise<NotificationsListResponse> => {
    const response = await axios.get("/api/notifications");
    return response.data;
  };

// Get unread notifications count
export const getUnreadNotificationsCount =
  async (): Promise<UnreadCountResponse> => {
    const response = await axios.get("/api/notifications/unread-count");
    return response.data;
  };

// Mark a notification as read
export const markNotificationAsRead = async (
  notificationId: string
): Promise<NotificationApiResponse> => {
  const response = await axios.patch(
    `/api/notifications/${notificationId}/read`
  );
  return response.data;
};

// Mark all notifications as read
export const markAllNotificationsAsRead =
  async (): Promise<NotificationApiResponse> => {
    const response = await axios.patch("/api/notifications/read-all");
    return response.data;
  };

// Delete a notification
export const deleteNotification = async (
  notificationId: string
): Promise<NotificationApiResponse> => {
  const response = await axios.delete(`/api/notifications/${notificationId}`);
  return response.data;
};
