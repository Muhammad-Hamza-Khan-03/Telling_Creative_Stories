"use client"
import { useStore } from "@/store/store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Undo, Redo, Menu, Wand2, Eye, Edit } from "lucide-react"

interface ToolbarProps {
  onCreateScene: () => void
  onGenerateBranches: () => void
  isGenerating: boolean
}

export function Toolbar({ onCreateScene, onGenerateBranches, isGenerating }: ToolbarProps) {
  const {
    currentProject,
    toggleSidebar,
    sidebarCollapsed,
    undo,
    redo,
    canUndo,
    canRedo,
    activeView,
    setActiveView,
    getProjectStats,
    currentNodeId,
  } = useStore()

  const stats = getProjectStats()

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={toggleSidebar} className="lg:hidden">
          <Menu className="w-5 h-5" />
        </Button>

        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
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
            <h1 className="text-xl font-bold text-gray-900">StoryForge</h1>
            {currentProject && <p className="text-sm text-gray-500 -mt-1">{currentProject.title}</p>}
          </div>
        </div>

        {/* Project Stats */}
        {stats.totalNodes > 0 && (
          <div className="hidden md:flex items-center space-x-3 text-sm text-gray-600">
            <Badge variant="secondary">{stats.totalNodes} scenes</Badge>
            <Badge variant="secondary">{stats.totalWords} words</Badge>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {stats.writtenNodes} written
            </Badge>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {/* View Toggle */}
        <div className="hidden md:flex bg-gray-100 rounded-lg p-1">
          <Button
            variant={activeView === "editor" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveView("editor")}
            className="h-8"
          >
            <Edit className="w-4 h-4 mr-1" />
            Editor
          </Button>
          <Button
            variant={activeView === "flow" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveView("flow")}
            className="h-8"
          >
            <Eye className="w-4 h-4 mr-1" />
            Flow
          </Button>
        </div>

        {/* Undo/Redo */}
        <div className="flex space-x-1">
          <Button variant="ghost" size="sm" onClick={undo} disabled={!canUndo()} title="Undo (Ctrl+Z)">
            <Undo className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={redo} disabled={!canRedo()} title="Redo (Ctrl+Shift+Z)">
            <Redo className="w-4 h-4" />
          </Button>
        </div>

        {/* AI Generate Branches */}
        {currentNodeId && (
          <Button
            onClick={onGenerateBranches}
            disabled={isGenerating}
            size="sm"
            variant="outline"
            className="hidden md:flex"
          >
            <Wand2 className={`w-4 h-4 mr-2 ${isGenerating ? "animate-spin" : ""}`} />
            {isGenerating ? "Generating..." : "Generate Branches"}
          </Button>
        )}

        {/* Create Scene */}
        <Button onClick={onCreateScene} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          New Scene
        </Button>
      </div>
    </header>
  )
}
