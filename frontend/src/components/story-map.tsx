"use client"

import type React from "react"
import { useCallback, useEffect } from "react"
import {ReactFlow} from "@xyflow/react"
import {
    type Node,
    type Edge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    type Connection,
    type NodeTypes,
    Handle,
    Position,
} from "@xyflow/react"
import '@xyflow/react/dist/style.css';
import { useStore } from "@/store/store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wand2, Edit, Trash2, Copy } from "lucide-react"

// Custom Story Node Component
function StoryNode({ data, selected }: { data: any; selected: boolean }) {
  const { setCurrentNode, deleteNode, duplicateNode } = useStore()

  const handleEdit = () => {
    setCurrentNode(data.id)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("Delete this scene?")) {
      deleteNode(data.id)
    }
  }

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation()
    duplicateNode(data.id)
  }

  return (
    <div
      className={`
      bg-white rounded-lg border-2 shadow-lg min-w-[200px] max-w-[250px]
      ${selected ? "border-blue-500 shadow-blue-200" : "border-gray-200"}
      ${data.status === "written" ? "bg-green-50 border-green-200" : ""}
      ${data.status === "suggestion" ? "bg-blue-50 border-blue-200 border-dashed" : ""}
      hover:shadow-xl transition-all duration-200
    `}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight">{data.title}</h3>
          <Badge variant={data.status === "written" ? "default" : "secondary"} className="text-xs">
            {data.status}
          </Badge>
        </div>

        {data.content && (
          <p className="text-xs text-gray-600 line-clamp-3 mb-3">
            {data.content.replace(/<[^>]*>/g, "").substring(0, 100)}...
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{data.wordCount} words</span>
          <div className="flex space-x-1">
            <Button size="sm" variant="ghost" onClick={handleEdit} className="h-6 w-6 p-0">
              <Edit className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDuplicate} className="h-6 w-6 p-0">
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  )
}

const nodeTypes: NodeTypes = {
  storyNode: StoryNode,
}

interface StoryMapProps {
  onNodeClick: (nodeId: string) => void
  onGenerateBranches: () => void
}

export function StoryMap({ onNodeClick: handleNodeClick, onGenerateBranches }: StoryMapProps) {
  const { nodes: storyNodes, currentNodeId, updateNodePosition, connectNodes, disconnectNodes } = useStore()

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  // Convert story nodes to React Flow nodes
  useEffect(() => {
    const flowNodes: Node[] = storyNodes.map((node) => ({
      id: node.id,
      type: "storyNode",
      position: node.position,
      data: {
        id: node.id,
        title: node.title,
        content: node.content,
        status: node.status,
        wordCount: node.wordCount,
      },
      selected: node.id === currentNodeId,
    }))

    const flowEdges: Edge[] = []
    storyNodes.forEach((node) => {
      node.connections.forEach((targetId) => {
        flowEdges.push({
          id: `${node.id}-${targetId}`,
          source: node.id,
          target: targetId,
          type: "smoothstep",
          animated: true,
          style: { stroke: "#6366f1", strokeWidth: 2 },
        })
      })
    })

    setNodes(flowNodes)
    setEdges(flowEdges)
  }, [storyNodes, currentNodeId, setNodes, setEdges])

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        connectNodes(params.source, params.target)
      }
    },
    [connectNodes],
  )

  const onNodeDragStop = useCallback(
    (event: any, node: Node) => {
      updateNodePosition(node.id, node.position)
    },
    [updateNodePosition],
  )

  const onEdgeClick = useCallback(
    (event: any, edge: Edge) => {
      if (confirm("Remove this connection?")) {
        disconnectNodes(edge.source, edge.target)
      }
    },
    [disconnectNodes],
  )

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
          <div className="space-y-2 text-sm text-gray-500">
            <p>
              💡 <strong>Tip:</strong> Click nodes to edit content
            </p>
            <p>
              🔗 <strong>Tip:</strong> Drag from node handles to create connections
            </p>
            <p>
              ✨ <strong>Tip:</strong> Use "Generate Branches" for AI story suggestions
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={(_, node) => handleNodeClick(node.id)}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-50"
      >
        <Background color="#e5e7eb" gap={20} />
        <Controls className="bg-white border border-gray-200 rounded-lg shadow-lg" />
      </ReactFlow>

      {/* Floating Generate Button */}
      {currentNodeId && (
        <div className="absolute bottom-4 right-4 z-10">
          <Button onClick={onGenerateBranches} className="bg-indigo-600 hover:bg-indigo-700 shadow-lg">
            <Wand2 className="w-4 h-4 mr-2" />
            Generate Branches
          </Button>
        </div>
      )}
    </div>
  )
}
export default StoryMap