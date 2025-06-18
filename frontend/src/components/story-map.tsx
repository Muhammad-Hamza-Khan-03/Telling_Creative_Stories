// components/story-map.tsx - Enhanced StoryNode component with improved integration
"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ReactFlow,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Connection,
  NodeTypes,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react"
import '@xyflow/react/dist/style.css'
import { useStore } from "@/store/store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wand2, Edit, Trash2, Copy, Plus, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"

/**
 * Enhanced StoryNode Component
 * 
 * This component now reflects the current API states and provides visual feedback
 * about AI operations. It's a great example of how UI components can provide
 * rich feedback without managing complex state themselves.
 */
function StoryNode({ data, selected }: { data: any; selected: boolean }) {
  const { 
    setCurrentNode, 
    deleteNode, 
    duplicateNode, 
    setIsEditing, 
    setActiveView, 
    updateNodeTitle,
    generateBranches,
    isGeneratingBranches,
    isRegeneratingBranches,
    branchGenerationError,
    currentNodeId,
    clearError,
  } = useStore()
  
  // Local state for title editing
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [localTitle, setLocalTitle] = useState(data.title || '')
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Update local title when data changes
  useEffect(() => {
    setLocalTitle(data.title || '')
  }, [data.title])

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [isEditingTitle])

  /**
   * Check if this node is currently involved in AI operations
   * This helps us provide contextual visual feedback
   */
  const isNodeGenerating = currentNodeId === data.id && (isGeneratingBranches || isRegeneratingBranches)
  const hasGenerationError = currentNodeId === data.id && branchGenerationError

  /**
   * Handle editing the node content
   * This sets up the editor with the current node
   */
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log('Editing node:', data.id)
   
    // Set current node and activate editor
    setCurrentNode(data.id)
    setActiveView("editor")
    setIsEditing(true)
  }

  /**
   * Handle generating AI branches for this specific node
   * This provides a convenient way to trigger AI from any node
   */
  const handleGenerateBranches = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Clear any existing errors for this operation
    if (hasGenerationError) {
      clearError('branch')
    }
    
    // Set this as the current node first
    setCurrentNode(data.id)
    
    try {
      await generateBranches(data.id)
      console.log('✅ Branches generated successfully from node:', data.id)
    } catch (error) {
      console.error('❌ Branch generation failed from node:', data.id, error)
      // Error handling is managed by the store, but we could add node-specific UI feedback here
    }
  }

  /**
   * Handle title editing with improved UX
   */
  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditingTitle(true)
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalTitle(e.target.value)
  }

  const handleTitleSubmit = () => {
    const trimmedTitle = localTitle.trim()
    if (trimmedTitle && trimmedTitle !== data.title) {
      updateNodeTitle(data.id, trimmedTitle)
    } else if (!trimmedTitle) {
      // Reset to original if empty
      setLocalTitle(data.title || 'Untitled Scene')
    }
    setIsEditingTitle(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation()
    if (e.key === 'Enter') {
      handleTitleSubmit()
    } else if (e.key === 'Escape') {
      setLocalTitle(data.title || '')
      setIsEditingTitle(false)
    }
  }

  const handleTitleBlur = () => {
    handleTitleSubmit()
  }

  /**
   * Handle node deletion with confirmation
   */
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("Delete this scene?")) {
      console.log('Deleting node:', data.id)
      deleteNode(data.id)
    }
  }

  /**
   * Handle node duplication
   */
  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log('Duplicating node:', data.id)
    const newNodeId = duplicateNode(data.id)
    if (newNodeId) {
      setCurrentNode(newNodeId)
      setActiveView("editor")
    }
  }

  /**
   * Handle clicking on the content preview
   */
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    handleEdit(e)
  }

  /**
   * Get visual styling based on node state
   * This provides immediate visual feedback about the node's current state
   */
  const getNodeStyling = () => {
    let baseClasses = "bg-white rounded-lg border-2 shadow-lg min-w-[200px] max-w-[250px] group transition-all duration-200"
    
    if (isNodeGenerating) {
      return `${baseClasses} border-blue-500 bg-blue-50 shadow-blue-200 ring-2 ring-blue-200 animate-pulse`
    }
    
    if (hasGenerationError) {
      return `${baseClasses} border-red-500 bg-red-50 shadow-red-200 ring-2 ring-red-200`
    }
    
    if (selected) {
      return `${baseClasses} border-blue-500 shadow-blue-200 ring-2 ring-blue-200`
    }
    
    // Status-based styling
    if (data.status === "written") {
      return `${baseClasses} bg-green-50 border-green-200`
    }
    
    if (data.status === "suggestion") {
      return `${baseClasses} bg-blue-50 border-blue-200 border-dashed`
    }
    
    return `${baseClasses} border-gray-200 hover:shadow-xl hover:border-indigo-300`
  }

  /**
   * Get appropriate status badge variant
   */
  const getStatusBadgeVariant = () => {
    if (data.status === "written") return "default"
    if (data.status === "suggestion") return "secondary"
    return "secondary"
  }

  /**
   * Get node operation icon based on current state
   * This provides visual context about what operations are available or happening
   */
  const getOperationIcon = () => {
    if (isNodeGenerating) {
      return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
    }
    
    if (hasGenerationError) {
      return <AlertCircle className="w-4 h-4 text-red-600" />
    }
    
    if (data.status === "suggestion") {
      return <CheckCircle2 className="w-4 h-4 text-blue-600" />
    }
    
    return <Wand2 className="w-4 h-4" />
  }

  return (
    <div className={getNodeStyling()}>
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 !bg-blue-500 border-2 border-white" 
      />

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          {/* Editable Title */}
          <div className="flex-1 min-w-0 mr-2">
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={localTitle}
                onChange={handleTitleChange}
                onKeyDown={handleTitleKeyDown}
                onBlur={handleTitleBlur}
                onClick={(e) => e.stopPropagation()}
                className="font-semibold text-gray-900 text-sm leading-tight w-full bg-white border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Scene title..."
              />
            ) : (
              <h3 
                className="font-semibold text-gray-900 text-sm leading-tight cursor-pointer hover:text-blue-600 transition-colors border border-transparent hover:border-gray-200 rounded px-2 py-1 -mx-2 -my-1"
                onClick={handleTitleClick}
                title="Click to edit title"
              >
                {data.title || 'Untitled Scene'}
              </h3>
            )}
          </div>
          
          <div className="flex items-center space-x-1 shrink-0">
            <Badge 
              variant={getStatusBadgeVariant()} 
              className="text-xs"
            >
              {data.status}
            </Badge>
            {/* Operation Status Indicator */}
            <div className="w-5 h-5 flex items-center justify-center" title={
              isNodeGenerating ? "Generating branches..." :
              hasGenerationError ? "Generation failed" :
              data.status === "suggestion" ? "AI-generated content" :
              "Ready for AI generation"
            }>
              {getOperationIcon()}
            </div>
          </div>
        </div>

        {/* Content Preview */}
        {data.content && (
          <p 
            className="text-xs text-gray-600 line-clamp-3 mb-3 cursor-pointer hover:text-gray-800 transition-colors hover:bg-gray-50 rounded p-1 -m-1"
            onClick={handleContentClick}
            title="Click to edit content"
          >
            {data.content.replace(/<[^>]*>/g, "").substring(0, 100)}
            {data.content.length > 100 ? "..." : ""}
          </p>
        )}

        {/* Node Status Messages */}
        {isNodeGenerating && (
          <div className="text-xs text-blue-600 mb-3 font-medium">
            🤖 {isRegeneratingBranches ? "Regenerating branches..." : "Generating AI branches..."}
          </div>
        )}

        {hasGenerationError && (
          <div className="text-xs text-red-600 mb-3 font-medium">
            ⚠️ Generation failed - try again
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{data.wordCount || 0} words</span>
          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            
            {/* AI Generate Button - context-sensitive */}
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleGenerateBranches}
              disabled={isNodeGenerating}
              className="h-6 w-6 p-0 hover:bg-blue-100"
              title={
                isNodeGenerating ? "Generating branches..." :
                hasGenerationError ? "Retry branch generation" :
                "Generate AI branches from this scene"
              }
            >
              {isNodeGenerating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Wand2 className="w-3 h-3" />
              )}
            </Button>
            
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleDuplicate} 
              className="h-6 w-6 p-0 hover:bg-gray-100"
              title="Duplicate scene"
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
              title="Delete scene"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 !bg-blue-500 border-2 border-white" 
      />
    </div>
  )
}

const nodeTypes: NodeTypes = {
  storyNode: StoryNode,
}

/**
 * Main StoryMap component interface
 * Simplified since it now gets everything from the store
 */
interface StoryMapProps {
  onNodeClick: (nodeId: string) => void
}

function StoryMapInner({ onNodeClick: handleNodeClick }: StoryMapProps) {
  const { 
    nodes: storyNodes, 
    currentNodeId, 
    updateNodePosition, 
    connectNodes, 
    disconnectNodes,
    addNode,
    setCurrentNode,
    setActiveView,
    generateBranches,
    isGeneratingBranches,
    serviceHealth,
  } = useStore()

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const { fitView } = useReactFlow()

  // Debug logging for development
  useEffect(() => {
    console.log('StoryMap: Story nodes changed:', storyNodes.length)
  }, [storyNodes])

  // Convert story nodes to React Flow nodes with enhanced data
  const flowNodes = useMemo(() => {
    console.log('Converting story nodes to flow nodes:', storyNodes.length)
    return storyNodes.map((node) => ({
      id: node.id,
      type: "storyNode",
      position: node.position,
      data: {
        id: node.id,
        title: node.title,
        content: node.content,
        status: node.status,
        wordCount: node.wordCount,
        tags: node.tags,
        notes: node.notes,
      },
      selected: node.id === currentNodeId,
    }))
  }, [storyNodes, currentNodeId])

  // Convert connections to React Flow edges
  const flowEdges = useMemo(() => {
    const edges: Edge[] = []
    storyNodes.forEach((node) => {
      node.connections.forEach((targetId) => {
        edges.push({
          id: `${node.id}-${targetId}`,
          source: node.id,
          target: targetId,
          type: "smoothstep",
          animated: true,
          style: { stroke: "#6366f1", strokeWidth: 2 },
        })
      })
    })
    console.log('Generated edges:', edges.length)
    return edges
  }, [storyNodes])

  // Update React Flow nodes and edges when story nodes change
  useEffect(() => {
    console.log('Updating React Flow with:', flowNodes.length, 'nodes and', flowEdges.length, 'edges')
    setNodes(flowNodes)
    setEdges(flowEdges)
    
    // Fit view if we have nodes
    if (flowNodes.length > 0) {
      setTimeout(() => fitView({ padding: 0.1 }), 100)
    }
  }, [flowNodes, flowEdges, setNodes, setEdges, fitView])

  /**
   * Handle connecting nodes
   */
  const onConnect = useCallback(
    (params: Connection) => {
      console.log('Connecting nodes:', params.source, 'to', params.target)
      if (params.source && params.target) {
        connectNodes(params.source, params.target)
      }
    },
    [connectNodes],
  )

  /**
   * Handle node position updates
   */
  const onNodeDragStop = useCallback(
    (event: any, node: Node) => {
      console.log('Node drag stopped:', node.id, node.position)
      updateNodePosition(node.id, node.position)
    },
    [updateNodePosition],
  )

  /**
   * Handle edge removal
   */
  const onEdgeClick = useCallback(
    (event: any, edge: Edge) => {
      if (confirm("Remove this connection?")) {
        console.log('Removing edge:', edge.source, 'to', edge.target)
        disconnectNodes(edge.source, edge.target)
      }
    },
    [disconnectNodes],
  )

  /**
   * Handle node selection
   */
  const onNodeClick = useCallback(
    (event: any, node: Node) => {
      console.log('Node clicked:', node.id)
      handleNodeClick(node.id)
      setActiveView("editor")
    },
    [handleNodeClick, setActiveView],
  )

  /**
   * Handle creating the first node
   */
  const handleCreateFirstNode = useCallback(() => {
    console.log('Creating first node')
    const nodeId = addNode("Opening Scene", { x: 250, y: 150 })
    setCurrentNode(nodeId)
    setActiveView("editor")
  }, [addNode, setCurrentNode, setActiveView])

  /**
   * Handle generating branches from the floating button
   */
  const handleFloatingGenerate = useCallback(async () => {
    if (!currentNodeId) return
    
    try {
      await generateBranches(currentNodeId)
    } catch (error) {
      console.error('Floating generate failed:', error)
    }
  }, [currentNodeId, generateBranches])

  // Empty state when no nodes exist
  if (storyNodes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Your Story Canvas</h3>
          <p className="text-gray-600 mb-6">Create your first scene to start mapping your story visually</p>
          
          <Button 
            onClick={handleCreateFirstNode}
            className="mb-4 bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create First Scene
          </Button>
          
          <div className="space-y-2 text-sm text-gray-500">
            <p>💡 <strong>Tip:</strong> Click nodes to edit content</p>
            <p>🔗 <strong>Tip:</strong> Drag from node handles to create connections</p>
            <p>✨ <strong>Tip:</strong> Use the magic wand to generate AI story branches</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 relative bg-gray-50" style={{ height: '100vh' ,width: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        fitView={false}
        className="bg-gray-50"
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.1}
        maxZoom={2}
        snapToGrid={true}
        snapGrid={[20, 20]}
      >
        <Background 
          color="#e5e7eb" 
          gap={20} 
          size={1}
        />
        <Controls 
          className="bg-white border border-gray-200 rounded-lg shadow-lg"
          showInteractive={false}
        />
      </ReactFlow>

      {/* Floating Generate Button with enhanced feedback */}
      {currentNodeId && (
        <div className="absolute bottom-4 right-4 z-10">
          <Button 
            onClick={handleFloatingGenerate}
            disabled={isGeneratingBranches || !serviceHealth.branches}
            className={`shadow-lg transition-all duration-200 ${
              isGeneratingBranches 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : !serviceHealth.branches
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
            title={
              !serviceHealth.branches ? "AI service not available" :
              isGeneratingBranches ? "Generating branches..." :
              "Generate AI story branches"
            }
          >
            {isGeneratingBranches ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Branches
              </>
            )}
          </Button>
        </div>
      )}

      {/* Development Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 bg-white p-2 rounded shadow text-xs">
          <div>Nodes: {storyNodes.length} | Flow Nodes: {nodes.length} | Edges: {edges.length}</div>
          {currentNodeId && <div>Current: {currentNodeId.slice(0, 8)}</div>}
          <div>AI: {serviceHealth.branches ? '✅' : '❌'} | Generating: {isGeneratingBranches ? '⏳' : '✅'}</div>
        </div>
      )}
    </div>
  )
}

export function StoryMap(props: StoryMapProps) {
  return (
    <ReactFlowProvider>
      <StoryMapInner {...props} />
    </ReactFlowProvider>
  )
}

export default StoryMap