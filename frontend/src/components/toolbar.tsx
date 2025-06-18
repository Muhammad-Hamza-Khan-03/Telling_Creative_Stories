"use client"
import { useStore } from "@/store/store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Undo, Redo, Menu, Wand2, Eye, Edit, AlertCircle, CheckCircle, Loader2, RotateCcw } from "lucide-react"
import { ThemeToggle } from "@/utils/themes"
import { useState, useEffect } from "react"

interface ToolbarProps {
  // We no longer need these props since the store handles the logic
  // onCreateScene: () => void
  // onGenerateBranches: () => void
  // isGenerating: boolean
}

export function Toolbar({ }: ToolbarProps) {
  const {
    currentProject,
    currentNodeId,
    toggleSidebar,
    sidebarCollapsed,
    undo,
    redo,
    canUndo,
    canRedo,
    activeView,
    setActiveView,
    getProjectStats,
    
    // New API-related state
    generateBranches,
    isGeneratingBranches,
    isRegeneratingBranches,
    branchGenerationError,
    serviceHealth,
    checkServiceHealth,
    connectionError,
    clearError,
    
    // Existing actions
    addNode,
    setCurrentNode,
  } = useStore()

  const stats = getProjectStats()
  const [showHealthDetails, setShowHealthDetails] = useState(false)

  // Auto-check health every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      checkServiceHealth()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [checkServiceHealth])

  /**
   * Handle creating a new scene
   * This now uses the store action directly instead of a prop
   */
  const handleCreateScene = () => {
    const title = `Scene ${stats.totalNodes + 1}`
    
    // Create node at a position that spreads them out nicely
    const baseX = 100 + (stats.totalNodes % 4) * 300
    const baseY = 100 + Math.floor(stats.totalNodes / 4) * 200
    const position = {
      x: baseX + (Math.random() - 0.5) * 50,
      y: baseY + (Math.random() - 0.5) * 50
    }
    
    const nodeId = addNode(title, position)
    setCurrentNode(nodeId)
  }

  /**
   * Handle generating AI branches
   * This now uses the enhanced store action with loading states
   */
  const handleGenerateBranches = async () => {
    if (!currentNodeId) {
      // This shouldn't happen if the UI is correct, but it's good defensive programming
      console.warn('No current node selected for branch generation')
      return
    }

    // Clear any existing errors before starting
    if (branchGenerationError) {
      clearError('branch')
    }

    try {
      await generateBranches(currentNodeId)
      // Success is handled by the store - the UI will automatically update
    } catch (error) {
      // Error is also handled by the store, but we could add additional UI logic here if needed
      console.error('Branch generation failed in component:', error)
    }
  }

  /**
   * Handle regenerating branches (bypasses cache)
   */
  const handleRegenerateBranches = async () => {
    if (!currentNodeId) return

    clearError('branch')

    try {
      await generateBranches(currentNodeId, { regenerate: true })
    } catch (error) {
      console.error('Branch regeneration failed in component:', error)
    }
  }

  /**
   * Determine the current connection status based on service health
   */
  const getConnectionStatus = () => {
    if (!serviceHealth.lastChecked) {
      return { status: 'unknown', color: 'gray', icon: AlertCircle }
    }

    const allHealthy = serviceHealth.system && serviceHealth.branches && serviceHealth.analytics
    if (allHealthy) {
      return { status: 'healthy', color: 'green', icon: CheckCircle }
    }

    const partiallyHealthy = serviceHealth.system || serviceHealth.branches
    if (partiallyHealthy) {
      return { status: 'partial', color: 'yellow', icon: AlertCircle }
    }

    return { status: 'error', color: 'red', icon: AlertCircle }
  }

  const connectionStatus = getConnectionStatus()

  /**
   * Get appropriate loading text based on current operations
   */
  const getLoadingText = () => {
    if (isRegeneratingBranches) return "Regenerating..."
    if (isGeneratingBranches) return "Generating..."
    return "Generate Branches"
  }

  /**
   * Determine if branch generation is currently possible
   */
  const canGenerateBranches = currentNodeId && !isGeneratingBranches && !isRegeneratingBranches

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 
                      flex items-center justify-between px-4 shadow-sm transition-colors">
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleSidebar} 
          className="lg:hidden dark:hover:bg-gray-800"
        >
          <Menu className="w-5 h-5" />
        </Button>

        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-600 dark:bg-indigo-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">StoryForge</h1>
            {currentProject && (
              <p className="text-sm text-gray-500 dark:text-gray-400 -mt-1">{currentProject.title}</p>
            )}
          </div>
        </div>

        {/* Connection Status Indicator - helps users understand if AI is available */}
        <div className="hidden md:flex items-center space-x-2">
          <div 
            className={`w-2 h-2 rounded-full ${
              connectionStatus.color === 'green' ? 'bg-green-500' :
              connectionStatus.color === 'yellow' ? 'bg-yellow-500' :
              connectionStatus.color === 'red' ? 'bg-red-500' : 'bg-gray-400'
            }`}
            title={`Services: ${connectionStatus.status}`}
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {connectionStatus.status === 'healthy' ? 'AI Ready' :
             connectionStatus.status === 'partial' ? 'AI Limited' :
             connectionStatus.status === 'error' ? 'AI Offline' : 'Checking...'}
          </span>
        </div>

        {/* Project Stats */}
        {stats.totalNodes > 0 && (
          <div className="hidden lg:flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
            <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-300">
              {stats.totalNodes} scenes
            </Badge>
            <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-300">
              {stats.totalWords} words
            </Badge>
            {stats.writtenNodes > 0 && (
              <Badge variant="default" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300">
                {stats.writtenNodes} written
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {/* Theme Toggle */}
        <ThemeToggle className="hidden lg:block" />

        {/* Undo/Redo */}
        <div className="flex space-x-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={undo} 
            disabled={!canUndo()} 
            title="Undo (Ctrl+Z)"
            className="dark:hover:bg-gray-800"
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={redo} 
            disabled={!canRedo()} 
            title="Redo (Ctrl+Shift+Z)"
            className="dark:hover:bg-gray-800"
          >
            <Redo className="w-4 h-4" />
          </Button>
        </div>

        {/* AI Generate Branches - Now with proper loading states and error handling */}
        {currentNodeId && (
          <div className="flex items-center space-x-1">
            <Button
              onClick={handleGenerateBranches}
              disabled={!canGenerateBranches}
              size="sm"
              variant="outline"
              className="hidden md:flex dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {isGeneratingBranches || isRegeneratingBranches ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4 mr-2" />
              )}
              {getLoadingText()}
            </Button>

            {/* Regenerate button - only show if branches exist or there was an error */}
            {(isGeneratingBranches || isRegeneratingBranches || branchGenerationError) && (
              <Button
                onClick={handleRegenerateBranches}
                disabled={!canGenerateBranches}
                size="sm"
                variant="ghost"
                title="Regenerate with different options"
                className="dark:hover:bg-gray-800"
              >
                {isRegeneratingBranches ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        )}

        {/* Create Scene */}
        <Button 
          onClick={handleCreateScene} 
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Scene
        </Button>
      </div>

      {/* Error Display - Shows when there are connection or generation errors */}
      {(branchGenerationError || connectionError) && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md px-4 py-2 shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-700 dark:text-red-300">
              {branchGenerationError || connectionError}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (branchGenerationError) clearError('branch')
                if (connectionError) clearError('connection')
              }}
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
            >
              ×
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}