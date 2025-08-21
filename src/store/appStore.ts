import { create } from 'zustand'
import type { AppState, Notification, Transaction } from '../types'

export const useAppStore = create<AppState>()((set, get) => ({
  notifications: [],
  transactions: [],
  settings: {
    companyName: 'Bodega Premium',
    companyAddress: 'Calle Principal 123',
    companyPhone: '+1234567890',
    companyEmail: 'info@bodegapremium.com',
    taxRate: 0.16,
    currency: 'MXN',
    lowStockThreshold: 10,
    orderDueDays: 7,
    timezone: 'America/Mexico_City',
    language: 'es'
  },
  addNotification: (notification) => {
    const entropy = Math.random().toString(36).slice(2, 8)
    const newNotification: Notification = {
      ...notification,
      id: `${Date.now()}-${entropy}`,
      createdAt: new Date()
    }
    set(state => ({
      notifications: [newNotification, ...state.notifications]
    }))
  },
  markAsRead: (id) => {
    set(state => ({
      notifications: state.notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      )
    }))
  },
  markNotificationAsRead: (id) => {
    set(state => ({
      notifications: state.notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      )
    }))
  },
  markAllNotificationsAsRead: () => {
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, read: true }))
    }))
  },
  deleteNotification: (id) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }))
  },
  clearNotifications: () => {
    set({ notifications: [] })
  },
  clearAllNotifications: () => {
    set({ notifications: [] })
  },
  updateSettings: (newSettings) => {
    set(state => ({
      settings: { ...state.settings, ...newSettings }
    }))
  },
  addTransaction: (transaction) => {
    const entropy = Math.random().toString(36).slice(2, 8)
    const newTransaction: Transaction = {
      ...transaction,
      id: `${Date.now()}-${entropy}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    set(state => ({
      transactions: [...state.transactions, newTransaction]
    }))
  }
}))
