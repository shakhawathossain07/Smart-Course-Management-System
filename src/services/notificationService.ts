import { supabase } from '../lib/supabase';
import { Notification } from '../types';

export class NotificationService {
  static async getUserNotifications(userId: string): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(notification => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        recipients: [notification.recipient_id || ''],
        createdAt: new Date(notification.created_at),
        read: notification.read || false,
      }));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  static async createNotification(notificationData: {
    type: 'assignment' | 'announcement' | 'attendance' | 'grade';
    title: string;
    message: string;
    recipientId: string;
  }): Promise<Notification | null> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          recipient_id: notificationData.recipientId,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        type: data.type,
        title: data.title,
        message: data.message,
        recipients: [data.recipient_id || ''],
        createdAt: new Date(data.created_at),
        read: data.read || false,
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  static async createBulkNotifications(notificationData: {
    type: 'assignment' | 'announcement' | 'attendance' | 'grade';
    title: string;
    message: string;
    recipientIds: string[];
  }): Promise<boolean> {
    try {
      const notifications = notificationData.recipientIds.map(recipientId => ({
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        recipient_id: recipientId,
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
      return false;
    }
  }
}