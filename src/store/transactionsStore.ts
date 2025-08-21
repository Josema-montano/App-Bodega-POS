import { create } from 'zustand'
import type { Transaction } from '../types'
import { transactionService } from '../services/transactionService'

interface TransactionsState {
  transactions: Transaction[]
  loading: boolean
  error: string | null
  fetchTransactions: () => Promise<void>
  fetchTodayTransactions: () => Promise<void>
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  getTransaction: (id: string) => Transaction | undefined
  getTransactionsByDateRange: (startDate: string, endDate: string) => Promise<Transaction[]>
  getTodayTransactions: () => Transaction[]
}

export const useTransactionsStore = create<TransactionsState>()((set, get) => ({
  transactions: [],
  loading: false,
  error: null,
  fetchTransactions: async () => {
    set({ loading: true, error: null })
    try {
      const transactions = await transactionService.getAll()
      set({ transactions, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },
  fetchTodayTransactions: async () => {
    set({ loading: true, error: null })
    try {
      const transactions = await transactionService.getToday()
      set({ transactions, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },
  addTransaction: async (transactionData) => {
    set({ loading: true, error: null })
    try {
      const transaction = await transactionService.create(transactionData)
      set(state => ({ transactions: [...state.transactions, transaction], loading: false }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  updateTransaction: async (id, transactionData) => {
    set({ loading: true, error: null })
    try {
      const transaction = await transactionService.update(id, transactionData)
      set(state => ({ transactions: state.transactions.map(t => t.id === id ? transaction : t), loading: false }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  deleteTransaction: async (id) => {
    set({ loading: true, error: null })
    try {
      await transactionService.delete(id)
      set(state => ({ transactions: state.transactions.filter(t => t.id !== id), loading: false }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  getTransaction: (id) => get().transactions.find(t => t.id === id),
  getTransactionsByDateRange: async (startDate, endDate) => {
    try {
      return await transactionService.getByDateRange(startDate, endDate)
    } catch (error) {
      console.error('Error al obtener transacciones por rango de fechas:', error)
      return []
    }
  },
  getTodayTransactions: () => {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    return get().transactions.filter(transaction => {
      const transactionDate = new Date(transaction.transactionDate || transaction.createdAt)
      return transactionDate >= startOfDay && transactionDate < endOfDay
    })
  }
}))
