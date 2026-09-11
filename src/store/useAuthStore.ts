import { create } from 'zustand'
import { ADMIN_PASSWORD, ADMIN_USERNAME } from '../lib/adminCredentials'

const SESSION_KEY = 'portfolio-admin-auth'

interface AuthState {
  authenticated: boolean
  /** Attempt a login; returns false when the password is wrong. */
  signIn: (password: string) => boolean
  signOut: () => void
}

function readSession(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === ADMIN_USERNAME
  } catch {
    return false
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  authenticated: readSession(),

  signIn: (password) => {
    if (password !== ADMIN_PASSWORD) return false
    try {
      sessionStorage.setItem(SESSION_KEY, ADMIN_USERNAME)
    } catch {
      // Private-mode browsers can refuse sessionStorage; auth still holds
      // for this page lifetime.
    }
    set({ authenticated: true })
    return true
  },

  signOut: () => {
    try {
      sessionStorage.removeItem(SESSION_KEY)
    } catch {
      /* ignore */
    }
    set({ authenticated: false })
  },
}))
