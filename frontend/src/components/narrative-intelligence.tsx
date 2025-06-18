// components/narrative-intelligence/ - UI components for AI-powered story generation
// These components surface the narrative intelligence to users in intuitive ways

"use client"

import React, { useState, useEffect } from "react"
import { useStore } from "@/store/store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Brain, 
  Sparkles, 
  BookOpen, 
  RefreshCw, 
  Play, 
  Pause,
  Download,
  Eye,
  Clock,
  TrendingUp,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Wand2,
  FileText,
  Users
} from "lucide-react"
import { GeneratedStory, NarrativeContext } from "@/lib/narrative-intelligence"

/**
 * Narrative Intelligence Control Panel
 * This is the main interface for managing AI-powered story generation
 */
export function NarrativeControlPanel() {
  const {
    autoGenerationEnabled,
    isGeneratingNarrative,
    narrativeInsights,
    lastNarrativeUpdate,
    toggleAutoGeneration,
    generatedStories,
    storyStructure
  } = useStore()

  const [showDetails, setShowDetails] = useState(false)
  
  const totalGeneratedStories = Object.keys(generatedStories).length
  const lastUpdateText = lastNarrativeUpdate 
    ? `Last updated ${lastNarrativeUpdate.toLocaleTimeString()}`
    : "Never updated"

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <span>Narrative Intelligence</span>
            {isGeneratingNarrative && (
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
            
            <Button
              variant={autoGenerationEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => toggleAutoGeneration(!autoGenerationEnabled)}
              disabled={isGeneratingNarrative}
            >
              {autoGenerationEnabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {autoGenerationEnabled ? "Enabled" : "Disabled"}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        
        {/* Status Overview */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-lg font-bold text-purple-700">{totalGeneratedStories}</div>
            <div className="text-xs text-purple-600">Generated Stories</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-700">
              {storyStructure?.totalBranches || 0}
            </div>
            <div className="text-xs text-blue-600">Story Branches</div>
          </div>
        </div>
        
        {/* Current Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            {isGeneratingNarrative ? (
              <>
                <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                <span className="text-sm font-medium text-blue-900">Generating story content...</span>
              </>
            ) : autoGenerationEnabled ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">Ready for auto-generation</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-900">Auto-generation paused</span>
              </>
            )}
          </div>
          <div className="text-xs text-gray-500">{lastUpdateText}</div>
        </div>
        
        {/* Detailed Information */}
        {showDetails && (
          <div className="space-y-3 border-t pt-4">
            
            {/* Recent Insights */}
            {narrativeInsights.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Lightbulb className="w-4 h-4 mr-1" />
                  Recent Insights
                </h4>
                <div className="space-y-1">
                  {narrativeInsights.slice(0, 3).map((insight, index) => (
                    <div key={index} className="text-xs text-gray-600 bg-yellow-50 p-2 rounded">
                      {insight}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Auto-Generation Settings */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Settings</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Auto-generate on connections:</span>
                  <Badge variant={autoGenerationEnabled ? "default" : "secondary"}>
                    {autoGenerationEnabled ? "On" : "Off"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Branch isolation:</span>
                  <Badge variant="default">Enabled</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Context dependency:</span>
                  <Badge variant="default">Sequential</Badge>
                </div>
              </div>
            </div>
            
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Generated Stories Gallery
 * Shows all complete stories generated for different branches
 */
export function GeneratedStoriesGallery() {
  const { 
    generatedStories, 
    storyStructure,
    exportGeneratedStory,
    regenerateBranchStory,
    isGeneratingNarrative 
  } = useStore()

  const [expandedStory, setExpandedStory] = useState<string | null>(null)
  const [exportFormat, setExportFormat] = useState<'txt' | 'html' | 'markdown'>('txt')

  if (Object.keys(generatedStories).length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Generated Stories Yet</h3>
          <p className="text-sm text-gray-600 mb-4">
            Connect your scenes to create story flow, and AI will automatically generate complete narratives.
          </p>
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
            <Sparkles className="w-3 h-3" />
            <span>Stories will appear here as you build your narrative structure</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleExportStory = (storyId: string) => {
    try {
      const exportedContent = exportGeneratedStory(storyId, exportFormat)
      
      // Create download
      const blob = new Blob([exportedContent], { 
        type: exportFormat === 'html' ? 'text/html' : 'text/plain' 
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `story-${storyId}.${exportFormat}`
      link.click()
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Generated Stories</span>
            <Badge variant="outline">{Object.keys(generatedStories).length}</Badge>
          </div>
          
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as any)}
            className="text-xs border rounded px-2 py-1"
          >
            <option value="txt">Text</option>
            <option value="markdown">Markdown</option>
            <option value="html">HTML</option>
          </select>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {Object.values(generatedStories).map((story) => (
          <GeneratedStoryCard
            key={story.branchId}
            story={story}
            isExpanded={expandedStory === story.branchId}
            onToggleExpand={() => setExpandedStory(
              expandedStory === story.branchId ? null : story.branchId
            )}
            onExport={() => handleExportStory(story.branchId)}
            onRegenerate={() => regenerateBranchStory(story.branchId)}
            isRegenerating={isGeneratingNarrative}
          />
        ))}
      </CardContent>
    </Card>
  )
}

/**
 * Individual Generated Story Card
 * Shows details and preview for a specific generated story
 */
interface GeneratedStoryCardProps {
  story: GeneratedStory
  isExpanded: boolean
  onToggleExpand: () => void
  onExport: () => void
  onRegenerate: () => void
  isRegenerating: boolean
}

function GeneratedStoryCard({
  story,
  isExpanded,
  onToggleExpand,
  onExport,
  onRegenerate,
  isRegenerating
}: GeneratedStoryCardProps) {
  
  return (
    <div className="border rounded-lg">
      {/* Story Header */}
      <div className="p-4 cursor-pointer" onClick={onToggleExpand}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h4 className="font-semibold text-gray-900">{story.title}</h4>
              <Badge variant="outline" className="text-xs">
                {story.scenes.length} scenes
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {story.wordCount} words
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-600">
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{story.estimatedReadingTime} min read</span>
              </div>
              <div className="flex items-center space-x-1">
                <BookOpen className="w-3 h-3" />
                <span>{story.storyMetadata.genre}</span>
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-3 h-3" />
                <span>{story.storyMetadata.tone}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onExport()
              }}
              className="h-8 w-8 p-0"
              title="Export story"
            >
              <Download className="w-3 h-3" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onRegenerate()
              }}
              disabled={isRegenerating}
              className="h-8 w-8 p-0"
              title="Regenerate story"
            >
              {isRegenerating ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Wand2 className="w-3 h-3" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Expanded Story Content */}
      {isExpanded && (
        <div className="border-t bg-gray-50 p-4">
          <div className="space-y-4">
            
            {/* Story Metadata */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Themes:</span>
                <div className="mt-1 space-x-1">
                  {story.storyMetadata.themes.map((theme, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {theme}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Structure:</span>
                <div className="mt-1 text-xs text-gray-600">
                  {story.scenes.length} connected scenes forming a complete narrative
                </div>
              </div>
            </div>
            
            {/* Scene Breakdown */}
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Scene Structure:</h5>
              <div className="space-y-2">
                {story.scenes.map((scene, index) => (
                  <div key={scene.nodeId} className="flex items-center space-x-3 text-sm">
                    <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{scene.title}</div>
                      {scene.contextUsed && (
                        <div className="text-xs text-gray-500">
                          Context: {scene.contextUsed}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {scene.content.split(' ').length} words
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Story Preview */}
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Story Preview:</h5>
              <div className="bg-white p-3 rounded border text-sm text-gray-700 line-clamp-4">
                {story.fullText.substring(0, 300)}
                {story.fullText.length > 300 && "..."}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="w-4 h-4 mr-2" />
                Export Story
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRegenerate}
                disabled={isRegenerating}
              >
                {isRegenerating ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4 mr-2" />
                )}
                Regenerate
              </Button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Scene Context Viewer
 * Shows what narrative context the AI knows about for the current scene
 */
export function SceneContextViewer() {
  const { 
    currentNodeId, 
    getNarrativeContext,
    regenerateSceneContent,
    isGeneratingNarrative 
  } = useStore()

  const [context, setContext] = useState<NarrativeContext | null>(null)
  const [showFullContext, setShowFullContext] = useState(false)

  useEffect(() => {
    if (currentNodeId) {
      const narrativeContext = getNarrativeContext(currentNodeId)
      setContext(narrativeContext)
    } else {
      setContext(null)
    }
  }, [currentNodeId, getNarrativeContext])

  if (!context) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <Brain className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Select a scene to see its narrative context</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Eye className="w-5 h-5 text-green-600" />
            <span>Scene Context</span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => regenerateSceneContent(context.currentNodeId)}
            disabled={isGeneratingNarrative}
          >
            {isGeneratingNarrative ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4 mr-2" />
            )}
            Regenerate
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        
        {/* Context Overview */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-lg font-bold text-blue-700">{context.positionInBranch}</div>
            <div className="text-xs text-blue-600">Scene Position</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-lg font-bold text-green-700">{context.predecessorNodes.length}</div>
            <div className="text-xs text-green-600">Previous Scenes</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-lg font-bold text-purple-700">{context.characterNames.length}</div>
            <div className="text-xs text-purple-600">Known Characters</div>
          </div>
        </div>
        
        {/* Branch Information */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium text-gray-700 mb-2">Branch Context:</div>
          <div className="text-xs text-gray-600">
            Scene {context.positionInBranch} of {context.totalScenesInBranch} in branch {context.branchId}
          </div>
        </div>
        
        {/* Characters */}
        {context.characterNames.length > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Users className="w-4 h-4 mr-1" />
              Known Characters:
            </div>
            <div className="flex flex-wrap gap-1">
              {context.characterNames.map((character, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {character}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Story Context */}
        {context.contextText.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-700">Previous Story Content:</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFullContext(!showFullContext)}
                className="text-xs"
              >
                {showFullContext ? "Show Less" : "Show More"}
              </Button>
            </div>
            <div className="bg-white p-3 rounded border text-xs text-gray-700">
              {showFullContext 
                ? context.contextText 
                : `${context.contextText.substring(0, 200)}${context.contextText.length > 200 ? "..." : ""}`
              }
            </div>
          </div>
        )}
        
        {/* No Context Warning */}
        {context.predecessorNodes.length === 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <div className="text-sm text-yellow-800">
                This is the first scene in its branch. AI will create an opening narrative.
              </div>
            </div>
          </div>
        )}
        
      </CardContent>
    </Card>
  )
}

/**
 * Narrative Insights Panel
 * Shows AI-generated insights about story structure and flow
 */
export function NarrativeInsightsPanel() {
  const { narrativeInsights, lastNarrativeUpdate } = useStore()

  if (narrativeInsights.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <Lightbulb className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Insights will appear as your story develops</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          <span>Story Insights</span>
          {lastNarrativeUpdate && (
            <Badge variant="outline" className="text-xs">
              {lastNarrativeUpdate.toLocaleTimeString()}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {narrativeInsights.map((insight, index) => (
          <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-sm text-yellow-800">{insight}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}