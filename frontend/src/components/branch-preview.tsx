"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  X, Users, Tag, Sparkles, ChevronRight, ChevronDown, ChevronUp, 
  Loader2, AlertCircle, RotateCcw, Wand2, Clock, Zap 
} from "lucide-react"
import { useState } from "react"
import { useStore } from "@/store/store"

/**
 * Enhanced Branch Preview Component
 * 
 * This component now reads all its state from the Zustand store instead of props.
 * This creates a cleaner architecture where the component is purely reactive
 * to state changes, and all business logic lives in the store.
 */
export function BranchPreview() {
  const {
    // Branch data and states
    branchOptions,
    isGeneratingBranches,
    isRegeneratingBranches,
    branchGenerationError,
    lastBranchGenerationTime,
    currentNodeId,
    
    // Actions
    selectBranch,
    clearBranchOptions,
    generateBranches,
    clearError,
  } = useStore()

  const [isCollapsed, setIsCollapsed] = useState(false)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)

  /**
   * Determine if we should show the branch preview panel
   * We show it when:
   * - There are branch options to display
   * - We're currently generating branches
   * - There was an error generating branches
   */
  const shouldShowPanel = branchOptions.length > 0 || isGeneratingBranches || isRegeneratingBranches || branchGenerationError

  if (!shouldShowPanel) {
    return null
  }

  /**
   * Handle selecting a branch option
   * This includes optimistic UI updates for better responsiveness
   */
  const handleBranchSelect = (option: any) => {
    if (!currentNodeId) {
      console.error('No current node to attach branch to')
      return
    }

    // Optimistic UI update - show selection immediately
    setSelectedOptionId(option.id)
    
    // Perform the actual selection (this will trigger store updates)
    setTimeout(() => {
      selectBranch(option, currentNodeId)
    }, 150) // Small delay to show the selection animation
  }

  /**
   * Handle regenerating branches
   * This provides a way for users to get different options if they don't like the current ones
   */
  const handleRegenerate = async () => {
    if (!currentNodeId) return

    // Clear any existing errors
    clearError('branch')
    
    try {
      await generateBranches(currentNodeId, { regenerate: true })
    } catch (error) {
      // Error is handled by the store, but we could add UI-specific error handling here
      console.error('Regeneration failed:', error)
    }
  }

  /**
   * Handle closing the panel
   * This clears the branch options and any related errors
   */
  const handleClose = () => {
    clearBranchOptions()
    clearError('branch')
  }

  /**
   * Get appropriate color scheme for impact levels
   * This provides visual hierarchy to help users understand the significance of each option
   */
  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case "high": 
        return "destructive" // Red - significant story changes
      case "medium": 
        return "default" // Blue - moderate impact
      case "low": 
        return "secondary" // Gray - subtle additions
      default: 
        return "secondary"
    }
  }

  /**
   * Get appropriate icon for the current state
   * Visual cues help users understand what's happening
   */
  const getStateIcon = () => {
    if (isRegeneratingBranches) return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
    if (isGeneratingBranches) return <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
    if (branchGenerationError) return <AlertCircle className="w-4 h-4 text-red-500" />
    return <Sparkles className="w-4 h-4 text-indigo-500" />
  }

  /**
   * Get appropriate title for the current state
   */
  const getStateTitle = () => {
    if (isRegeneratingBranches) return "Regenerating Branches..."
    if (isGeneratingBranches) return "Generating AI Branches..."
    if (branchGenerationError) return "Generation Failed"
    return "AI Story Branches"
  }

  /**
   * Get subtitle with helpful context information
   */
  const getStateSubtitle = () => {
    if (isRegeneratingBranches) return "Creating fresh options"
    if (isGeneratingBranches) return "AI is analyzing your story"
    if (branchGenerationError) return "Try regenerating or check connection"
    
    const optionCount = branchOptions.length
    const timeText = lastBranchGenerationTime ? ` • ${lastBranchGenerationTime.toFixed(1)}s` : ''
    return `${optionCount} option${optionCount !== 1 ? 's' : ''} generated${timeText}`
  }

  return (
    <div className="fixed right-0 top-16 bottom-0 w-80 lg:w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-xl z-30 flex flex-col">
      
      {/* Header with dynamic state information */}
      <div className={`flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 ${isCollapsed ? 'border-b-0' : ''}`}>
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-indigo-500 rounded-md flex items-center justify-center">
            {getStateIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">
              {getStateTitle()}
            </h3>
            {!isCollapsed && (
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {getStateSubtitle()}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-7 w-7 p-0"
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClose}
            className="h-7 w-7 p-0"
            title="Close branch preview"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content area - shows different content based on current state */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto">
          
          {/* Loading State - Clean, informative design */}
          {(isGeneratingBranches || isRegeneratingBranches) && (
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {isRegeneratingBranches ? "Creating Fresh Options" : "Analyzing Your Story"}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {isRegeneratingBranches 
                    ? "Generating new branch possibilities with different creative directions..."
                    : "AI is reading your scene and crafting multiple story paths to explore..."}
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  This usually takes 5-15 seconds
                </div>
              </div>
            </div>
          )}

          {/* Error State - Helpful and actionable */}
          {branchGenerationError && !isGeneratingBranches && !isRegeneratingBranches && (
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Generation Failed
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {branchGenerationError}
                </p>
                <div className="space-y-2">
                  <Button 
                    onClick={handleRegenerate}
                    className="bg-indigo-600 hover:bg-indigo-700 w-full"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => clearError('branch')}
                    className="w-full"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Success State - Show generated branch options */}
          {branchOptions.length > 0 && !isGeneratingBranches && !isRegeneratingBranches && (
            <div className="p-4 space-y-3">
              {branchOptions.map((option, index) => (
                <Card
                  key={option.id}
                  className={`cursor-pointer transition-all duration-200 border
                    ${selectedOptionId === option.id 
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 scale-[1.02]" 
                      : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md"
                    }`}
                  onClick={() => handleBranchSelect(option)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm font-bold text-gray-900 dark:text-white leading-tight flex-1">
                        {option.title}
                      </CardTitle>
                      <div className="flex items-center space-x-1 shrink-0">
                        <Badge
                          variant={getImpactColor(option.impact)}
                          className="text-xs"
                        >
                          {option.impact}
                        </Badge>
                        <ChevronRight className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      {option.summary}
                    </p>
                  </CardHeader>

                  <CardContent className="pt-0 space-y-3">
                    {/* Content Preview */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 border-l-2 border-indigo-200 dark:border-indigo-700">
                      <p className="text-xs text-gray-700 dark:text-gray-300 italic leading-relaxed">
                        "{option.content.substring(0, 80)}
                        {option.content.length > 80 ? "..." : ""}"
                      </p>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-2">
                      {/* Characters */}
                      {option.characters.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3 text-indigo-400 shrink-0" />
                          <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                            {option.characters.slice(0, 2).map((character) => (
                              <span 
                                key={character} 
                                className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-full"
                              >
                                {character}
                              </span>
                            ))}
                            {option.characters.length > 2 && (
                              <span className="text-xs text-gray-500">+{option.characters.length - 2}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Tags */}
                      {option.tags.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <Tag className="w-3 h-3 text-purple-400 shrink-0" />
                          <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                            {option.tags.slice(0, 3).map((tag) => (
                              <Badge 
                                key={tag} 
                                variant="outline" 
                                className="text-xs h-4 px-1 border-purple-200 dark:border-purple-700 text-purple-600 dark:text-purple-400"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {option.tags.length > 3 && (
                              <span className="text-xs text-gray-500">+{option.tags.length - 3}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <Button 
                      className={`w-full h-7 text-xs transition-all duration-200 ${
                        selectedOptionId === option.id
                          ? "bg-indigo-600 hover:bg-indigo-700" 
                          : "bg-indigo-500 hover:bg-indigo-600"
                      }`}
                      size="sm"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      {selectedOptionId === option.id ? "Selecting..." : "Choose This Path"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer with regeneration option - only show when we have results */}
      {!isCollapsed && branchOptions.length > 0 && !isGeneratingBranches && !isRegeneratingBranches && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800">
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              💡 Not quite right? Try regenerating for different ideas
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRegenerate}
              className="flex-1 h-7 text-xs"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Regenerate
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleClose}
              className="h-7 text-xs px-3"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}