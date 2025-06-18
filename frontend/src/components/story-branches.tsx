"use client"

import React, { useEffect, useState } from "react"
import { useStore } from "@/store/store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  GitBranch, 
  BookOpen, 
  TrendingUp, 
  AlertCircle, 
  Eye, 
  Download,
  Network,
  FileText,
  BarChart3,
  ChevronRight,
  ChevronDown
} from "lucide-react"
import { StoryBranch, StoryStructure } from "@/lib/story-graph"

/**
 * Branch Overview Panel - Shows high-level story structure information
 * This gives writers a bird's-eye view of their narrative complexity
 */
export function BranchOverviewPanel() {
  const { 
    storyStructure, 
    isAnalyzingStructure, 
    analyzeStoryStructure, 
    currentBranchId 
  } = useStore()
  
  // Compute stats for the current branch
  const stats = React.useMemo(() => {
    if (!storyStructure) {
      return {
        isLinearStory: true,
        branchCount: 0,
        mainBranchWordCount: 0,
      }
    }
    const isLinearStory = storyStructure.alternateBranches.length === 0
    const branchCount = 1 + storyStructure.alternateBranches.length
    const mainBranchWordCount = storyStructure.mainBranch.wordCount
    return {
      isLinearStory,
      branchCount,
      mainBranchWordCount,
    }
  }, [storyStructure])
  
  // Auto-analyze structure when component mounts if not already done
  useEffect(() => {
    if (!storyStructure && !isAnalyzingStructure) {
      analyzeStoryStructure()
    }
  }, [storyStructure, isAnalyzingStructure, analyzeStoryStructure])
  
  if (isAnalyzingStructure) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Network className="w-5 h-5 animate-pulse" />
            <span>Analyzing Story Structure...</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">Mapping your narrative connections...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (!storyStructure) {
    return (
      <Card className="w-full border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            <span>Story Structure Unknown</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Connect your story nodes to see the narrative structure analysis.
          </p>
          <Button onClick={analyzeStoryStructure} size="sm">
            <Network className="w-4 h-4 mr-2" />
            Analyze Structure
          </Button>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GitBranch className="w-5 h-5 text-blue-600" />
            <span>Story Structure</span>
          </div>
          <Button variant="ghost" size="sm" onClick={analyzeStoryStructure}>
            <TrendingUp className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Structure Type Indicator */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            {stats.isLinearStory ? (
              <>
                <BookOpen className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Linear Story</span>
              </>
            ) : (
              <>
                <GitBranch className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium">Branching Narrative</span>
              </>
            )}
          </div>
          <Badge variant={stats.isLinearStory ? "default" : "secondary"}>
            {stats.branchCount} {stats.branchCount === 1 ? 'Path' : 'Paths'}
          </Badge>
        </div>
        
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-700">{stats.mainBranchWordCount}</div>
            <div className="text-xs text-blue-600">Main Branch Words</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-700">{storyStructure.totalBranches}</div>
            <div className="text-xs text-green-600">Story Branches</div>
          </div>
        </div>
        
        {/* Orphaned Nodes Warning */}
        {storyStructure.orphanedNodes.length > 0 && (
          <div className="flex items-center space-x-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <AlertCircle className="w-4 h-4 text-orange-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-orange-800">
                {storyStructure.orphanedNodes.length} unconnected scenes
              </p>
              <p className="text-xs text-orange-600">
                Consider connecting these to your main story flow
              </p>
            </div>
          </div>
        )}
        
      </CardContent>
    </Card>
  )
}

/**
 * Branch List Component - Shows all story branches with details
 * This helps writers understand their different narrative paths
 */
export function BranchListPanel() {
  const { 
    storyStructure, 
    currentBranchId, 
    setCurrentBranch, 
    exportByBranch,
    exportAllBranches 
  } = useStore()
  
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set())
  
  if (!storyStructure) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <GitBranch className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">No story structure available</p>
        </CardContent>
      </Card>
    )
  }
  
  const allBranches = [storyStructure.mainBranch, ...storyStructure.alternateBranches]
    .filter(branch => branch.nodes.length > 0)
  
  const toggleBranchExpansion = (branchId: string) => {
    const newExpanded = new Set(expandedBranches)
    if (newExpanded.has(branchId)) {
      newExpanded.delete(branchId)
    } else {
      newExpanded.add(branchId)
    }
    setExpandedBranches(newExpanded)
  }
  
  const handleExportBranch = (branchId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const exportData = exportByBranch(branchId)
      
      // Create download link
      const blob = new Blob([exportData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `story-branch-${branchId}.json`
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
            <FileText className="w-5 h-5" />
            <span>Story Branches</span>
          </div>
          {allBranches.length > 1 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const allExports = exportAllBranches()
                console.log('Exported all branches:', allExports)
                // You could implement a more sophisticated multi-file download here
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Export All
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {allBranches.map((branch) => (
          <BranchCard
            key={branch.id}
            branch={branch}
            isMain={branch.id === storyStructure.mainBranch.id}
            isCurrent={branch.id === currentBranchId}
            isExpanded={expandedBranches.has(branch.id)}
            onSelect={() => setCurrentBranch(branch.id)}
            onToggleExpand={() => toggleBranchExpansion(branch.id)}
            onExport={(e) => handleExportBranch(branch.id, e)}
          />
        ))}
      </CardContent>
    </Card>
  )
}

/**
 * Individual Branch Card Component
 * Shows detailed information about a single story branch
 */
interface BranchCardProps {
  branch: StoryBranch
  isMain: boolean
  isCurrent: boolean
  isExpanded: boolean
  onSelect: () => void
  onToggleExpand: () => void
  onExport: (e: React.MouseEvent) => void
}

function BranchCard({ 
  branch, 
  isMain, 
  isCurrent, 
  isExpanded, 
  onSelect, 
  onToggleExpand, 
  onExport 
}: BranchCardProps) {
  
  return (
    <div 
      className={`
        border rounded-lg cursor-pointer transition-all duration-200
        ${isCurrent 
          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
        }
      `}
      onClick={onSelect}
    >
      {/* Branch Header */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onToggleExpand()
              }}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h4 className="font-medium text-gray-900 truncate">
                  {branch.title}
                </h4>
                {isMain && (
                  <Badge variant="default" className="text-xs">
                    Main
                  </Badge>
                )}
                {branch.isComplete && (
                  <Badge variant="secondary" className="text-xs">
                    Complete
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-4 mt-1 text-xs text-gray-600">
                <span>{branch.nodes.length} scenes</span>
                <span>{branch.wordCount} words</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onExport}
              className="h-8 w-8 p-0"
              title="Export this branch"
            >
              <Download className="w-3 h-3" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onSelect()
              }}
              className="h-8 w-8 p-0"
              title="View this branch"
            >
              <Eye className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Expanded Branch Details */}
      {isExpanded && (
        <div className="border-t bg-gray-50 p-4">
          <div className="space-y-3">
            
            {/* Scene List */}
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Scenes in this branch:</h5>
              <div className="space-y-1">
                {branch.nodes.map((node, index) => (
                  <div 
                    key={node.id} 
                    className="flex items-center space-x-2 text-xs text-gray-600 bg-white p-2 rounded"
                  >
                    <span className="w-4 text-center font-mono">{index + 1}</span>
                    <span className="flex-1 truncate">{node.title}</span>
                    <Badge 
                      variant={node.status === 'written' ? 'default' : 'secondary'} 
                      className="text-xs"
                    >
                      {node.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Branch Statistics */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-2 rounded">
                <div className="text-sm font-bold text-blue-600">{branch.wordCount}</div>
                <div className="text-xs text-gray-600">Words</div>
              </div>
              <div className="bg-white p-2 rounded">
                <div className="text-sm font-bold text-green-600">{branch.nodes.length}</div>
                <div className="text-xs text-gray-600">Scenes</div>
              </div>
              <div className="bg-white p-2 rounded">
                <div className="text-sm font-bold text-purple-600">
                  {Math.round(branch.wordCount / Math.max(branch.nodes.length, 1))}
                </div>
                <div className="text-xs text-gray-600">Avg/Scene</div>
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Branch Navigator Component - Shows current branch context in editor
 * This helps writers understand which narrative path they're working on
 */
export function BranchNavigator() {
  const { 
    currentNodeId, 
    getBranchContainingNode, 
    storyStructure,
    setCurrentBranch 
  } = useStore()
  
  if (!currentNodeId || !storyStructure) {
    return null
  }
  
  const currentBranch = getBranchContainingNode(currentNodeId)
  
  if (!currentBranch) {
    return (
      <div className="flex items-center space-x-2 p-2 bg-orange-50 border border-orange-200 rounded text-sm">
        <AlertCircle className="w-4 h-4 text-orange-600" />
        <span className="text-orange-800">Current scene is not connected to story flow</span>
      </div>
    )
  }
  
  // Find the position of current node in the branch
  const nodeIndex = currentBranch.nodes.findIndex(node => node.id === currentNodeId)
  const isMainBranch = currentBranch.id === storyStructure.mainBranch.id
  
  return (
    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          {isMainBranch ? (
            <BookOpen className="w-4 h-4 text-blue-600" />
          ) : (
            <GitBranch className="w-4 h-4 text-purple-600" />
          )}
          <span className="text-sm font-medium text-gray-900">
            {currentBranch.title}
          </span>
          {isMainBranch && (
            <Badge variant="default" className="text-xs">Main</Badge>
          )}
        </div>
        
        <div className="text-xs text-gray-600">
          Scene {nodeIndex + 1} of {currentBranch.nodes.length}
        </div>
      </div>
      
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => setCurrentBranch(currentBranch.id)}
        className="text-xs"
      >
        <BarChart3 className="w-3 h-3 mr-1" />
        View Branch
      </Button>
    </div>
  )
}

/**
 * Story Structure Visualization Component
 * A simple tree-like visualization of the story structure
 * This could be expanded into a more sophisticated diagram later
 */
export function StoryStructureVisualization() {
  const { storyStructure } = useStore()
  
  if (!storyStructure) {
    return null
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Network className="w-5 h-5" />
          <span>Story Structure</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          
          {/* Main Branch Visualization */}
          <div className="border-l-2 border-blue-500 pl-4">
            <div className="flex items-center space-x-2 mb-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span className="font-medium">Main Story</span>
              <Badge variant="default" className="text-xs">
                {storyStructure.mainBranch.wordCount} words
              </Badge>
            </div>
            <div className="text-sm text-gray-600">
              {storyStructure.mainBranch.nodes.length} scenes
            </div>
          </div>
          
          {/* Alternate Branches */}
          {storyStructure.alternateBranches.map((branch, index) => (
            <div key={branch.id} className="border-l-2 border-purple-400 pl-4">
              <div className="flex items-center space-x-2 mb-2">
                <GitBranch className="w-4 h-4 text-purple-600" />
                <span className="font-medium">
                  Alternate Path {index + 1}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {branch.wordCount} words
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                {branch.nodes.length} scenes
              </div>
            </div>
          ))}
          
          {/* Orphaned Nodes */}
          {storyStructure.orphanedNodes.length > 0 && (
            <div className="border-l-2 border-orange-400 pl-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <span className="font-medium">Unconnected Scenes</span>
                <Badge variant="outline" className="text-xs">
                  {storyStructure.orphanedNodes.length} scenes
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                Consider connecting these to your story flow
              </div>
            </div>
          )}
          
        </div>
      </CardContent>
    </Card>
  )
}