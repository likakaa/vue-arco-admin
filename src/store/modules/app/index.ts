import { defineStore } from 'pinia'
import appSettings from '@/settings.json'
import type { AppState } from './types'

export const useAppStore = defineStore({
  id: 'app',
  state: (): AppState => ({
    ...appSettings,
  }),
  getters: {},
  actions: {
    // change theme
    toggleTheme(dark: boolean) {
      if (dark) {
        this.theme = 'dark'
        document.body.setAttribute('arco-theme', 'dark')
        document.documentElement.classList.toggle('dark', true)
      } else {
        this.theme = 'light'
        document.body.removeAttribute('arco-theme')
        document.documentElement.classList.toggle('dark', false)
      }
    },
    // update settings
    updateSettings(partial: Partial<AppState>) {
      this.$patch(partial)
    },
  },
})
