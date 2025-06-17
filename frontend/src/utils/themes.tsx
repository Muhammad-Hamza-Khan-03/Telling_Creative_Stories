"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({ 
  children, 
  defaultTheme = 'system',
  storageKey = 'storyforge-theme'
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem(storageKey) as Theme
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setTheme(savedTheme)
    }
    setMounted(true)
  }, [storageKey])

  // Resolve the actual theme (handle system preference)
  useEffect(() => {
    const resolveTheme = () => {
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        setResolvedTheme(systemTheme)
        return systemTheme
      } else {
        setResolvedTheme(theme)
        return theme
      }
    }

    const currentTheme = resolveTheme()

    // Apply theme to document
    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    // Listen for system theme changes when using 'system' theme
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => {
        const newSystemTheme = mediaQuery.matches ? 'dark' : 'light'
        setResolvedTheme(newSystemTheme)
        
        if (newSystemTheme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }

      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme])

  // Save theme to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(storageKey, theme)
    }
  }, [theme, storageKey, mounted])

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme)
  }

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('light')
    } else {
      // If system, toggle to opposite of current resolved theme
      setTheme(resolvedTheme === 'light' ? 'dark' : 'light')
    }
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme: handleSetTheme,
      resolvedTheme,
      toggleTheme
    }}>
      {children}
    </ThemeContext.Provider>
  )
}
