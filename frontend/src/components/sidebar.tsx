"use client"

import React, { useState } from "react"
import { useStore } from "@/store/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Trash2, Copy, X, ChevronLeft, ChevronRight } from "lucide-react"

export function Sidebar() {
  const {
    nodes,
    currentNodeId,
    selectedNodeIds,
    setCurrentNode,
    selectNode,
    deleteNode,
    duplicateNode,
    updateNodeTitle,
    sidebarCollapsed,
    toggleSidebar,
    searchNodes,
    getProjectStats,
  } = useStore()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const stats = getProjectStats()

  // Filter nodes based on search and status
  const filteredNodes = React.useMemo(() => {
    let filtered = nodes

    if (searchQuery.trim()) {
      filtered = searchNodes(searchQuery)
    }

    if (selectedStatus) {
      filtered = filtered.filter((node) => node.status === selectedStatus)
    }

    return filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [nodes, searchQuery, selectedStatus, searchNodes])

  const handleSelectScene = (nodeId: string, multiSelect = false) => {
    if (multiSelect) {
      selectNode(nodeId, true)
    } else {
      setCurrentNode(nodeId)
      selectNode(nodeId, false)
    }
  }

  const handleDeleteScene = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("Are you sure you want to delete this scene?")) {
      deleteNode(nodeId)
    }
  }

  const handleDuplicateScene = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newNodeId = duplicateNode(nodeId)
    setCurrentNode(newNodeId)
  }

  return (
    <>
      {/* Sidebar */}
      <div
        className={`
        fixed left-0 top-16 h-[calc(100vh-64px)] bg-white border-r border-gray-200 shadow-lg z-30
        transition-transform duration-300 ease-in-out
        ${sidebarCollapsed ? "-translate-x-full" : "translate-x-0"}
        w-80
      `}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Scenes</h2>
            <Button variant="ghost" size="sm" onClick={toggleSidebar} className="lg:hidden">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search scenes..."
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="written">Written</option>
            <option value="suggestion">Suggestion</option>
          </select>

          {/* Stats */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white rounded p-2 text-center">
              <div className="font-semibold text-gray-900">{stats.totalNodes}</div>
              <div className="text-gray-500">Total</div>
            </div>
            <div className="bg-white rounded p-2 text-center">
              <div className="font-semibold text-gray-900">{stats.totalWords}</div>
              <div className="text-gray-500">Words</div>
            </div>
          </div>
        </div>

        {/* Scene List */}
        <div className="overflow-y-auto h-full pb-20">
          {filteredNodes.length === 0 ? (
            <div className="p-6 text-center">
              {nodes.length === 0 ? (
                <>
                  <div className="w-12 h-12 mx-auto mb-3 text-gray-400">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-500 mb-2">No scenes yet</p>
                  <p className="text-xs text-gray-400">Create your first scene to get started</p>
                </>
              ) : (
                <p className="text-gray-500">No scenes match your search</p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNodes.map((node) => (
                <div
                  key={node.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    currentNodeId === node.id ? "bg-blue-50 border-r-2 border-blue-500" : ""
                  } ${selectedNodeIds.includes(node.id) ? "bg-blue-50" : ""}`}
                  onClick={(e) => handleSelectScene(node.id, e.ctrlKey || e.metaKey)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={node.title}
                        onChange={(e) => updateNodeTitle(node.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="font-medium text-gray-900 bg-transparent border-none outline-none w-full truncate text-sm"
                      />

                      <div className="flex items-center mt-2 space-x-2">
                        <Badge variant={node.status === "written" ? "default" : "secondary"} className="text-xs">
                          {node.status}
                        </Badge>
                        <span className="text-xs text-gray-500">{node.wordCount} words</span>
                        {node.connections.length > 0 && (
                          <span className="text-xs text-gray-400">🔗 {node.connections.length}</span>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 mt-1">{new Date(node.updatedAt).toLocaleDateString()}</p>
                    </div>

                    <div className="ml-2 flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDuplicateScene(node.id, e)}
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteScene(node.id, e)}
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Toggle Button (Desktop) */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleSidebar}
        className={`
          hidden lg:flex fixed left-0 top-1/2 transform -translate-y-1/2 z-40
          transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? "translate-x-0" : "translate-x-80"}
          bg-white border border-gray-200 shadow-lg rounded-r-lg
          h-12 w-6 items-center justify-center
        `}
      >
        {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </Button>

      {/* Mobile Overlay */}
      {!sidebarCollapsed && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20" onClick={toggleSidebar} />
      )}
    </>
  )
}
