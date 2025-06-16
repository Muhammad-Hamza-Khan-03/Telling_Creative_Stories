"use client"

import { useState } from "react"
import { useStore } from "@/store/store"
import { StoryMap } from "@/components/story-map"
import { TextEditor } from "@/components/textEditor"
import { BranchPreview } from "@/components/branch-preview"
import { Toolbar } from "@/components/toolbar"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"

export default function StoryForgePage() {
  const {
    currentProject,
    projects,
    createProject,
    nodes,
    currentNodeId,
    selectedNodeIds,
    addNode,
    setCurrentNode,
    sidebarCollapsed,
    toggleSidebar,
    undo,
    redo,
    canUndo,
    canRedo,
    getProjectStats,
  } = useStore()

  const [showProjectModal, setShowProjectModal] = useState(false)
  const [newProjectTitle, setNewProjectTitle] = useState("")
  type Branch = {
    id: string
    title: string
    summary: string
    content: string
    characters: string[]
    impact: string
    tags: string[]
  }
  const [branches, setBranches] = useState<Branch[]>([])
  const [isGeneratingBranches, setIsGeneratingBranches] = useState(false)

  const stats = getProjectStats()

  // Handle project creation
  const handleCreateProject = () => {
    if (!newProjectTitle.trim()) return
    createProject(newProjectTitle)
    setNewProjectTitle("")
    setShowProjectModal(false)
  }

  // Handle scene creation
  const handleCreateScene = () => {
    if (!currentProject) {
      setShowProjectModal(true)
      return
    }

    const title = `Scene ${nodes.length + 1}`
    const nodeId = addNode(title, {
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
    })
    setCurrentNode(nodeId)
  }

  // Handle branch generation (mock AI integration)
  const handleGenerateBranches = async () => {
    const currentNode = nodes.find((n) => n.id === currentNodeId)
    if (!currentNode) return

    setIsGeneratingBranches(true)

    // Mock AI branch generation
    setTimeout(() => {
      const mockBranches = [
        {
          id: "1",
          title: "The Enchanted Sleep",
          summary: "The apple puts Cinderella into a magical slumber, revealing hidden dreams.",
          content:
            "As Cinderella bit into the apple, a warm drowsiness overcame her. But this was no ordinary sleep - in her dreams, she could see the future, including the prince's arrival.",
          characters: ["Cinderella", "Dream Oracle"],
          impact: "High",
          tags: ["magic", "prophecy"],
        },
        {
          id: "2",
          title: "The Talking Apple",
          summary: "The apple comes alive and warns Cinderella of impending danger.",
          content:
            'The apple suddenly spoke! "Quick! The Prince is coming tonight! Your stepmother plans to lock you in the cellar!" it whispered urgently.',
          characters: ["Cinderella", "Magic Apple"],
          impact: "Medium",
          tags: ["magic", "warning"],
        },
        {
          id: "3",
          title: "Allergic Reaction",
          summary: "Cinderella discovers she's allergic to magical apples, leading to chaos.",
          content:
            'Cinderella\'s face began to swell and turn red. "Oh no!" she gasped, "I\'m allergic to enchanted fruit!" The fairy godmother would have to find another way.',
          characters: ["Cinderella", "Fairy Godmother"],
          impact: "Low",
          tags: ["comedy", "obstacle"],
        },
      ]

      setBranches(mockBranches)
      setIsGeneratingBranches(false)
    }, 2000)
  }

  // Handle branch selection
  const handleBranchSelect = (branch:any) => {
    const nodeId = addNode(branch.title, {
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
    })

    // Connect to current node if one exists
    if (currentNodeId) {
      useStore.getState().connectNodes(currentNodeId, nodeId)
    }

    // Set content and switch to new node
    useStore.getState().updateNodeContent(nodeId, branch.content)
    setCurrentNode(nodeId)
    setBranches([]) // Clear branches after selection
  }

  // Welcome screen for new users
  if (!currentProject && projects.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 text-indigo-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to StoryForge</h1>
          <p className="text-gray-600 mb-8 text-lg">
            Create your first project to start crafting your story, scene by scene.
          </p>
          <Button onClick={() => setShowProjectModal(true)} size="lg" className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-5 h-5 mr-2" />
            Create Your First Project
          </Button>
        </div>

        {/* Project Creation Modal */}
        {showProjectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-96 max-w-full mx-4 shadow-2xl">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Create New Project</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Title</label>
                  <Input
                    value={newProjectTitle}
                    onChange={(e) => setNewProjectTitle(e.target.value)}
                    placeholder="My Amazing Story"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <Button variant="outline" onClick={() => setShowProjectModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateProject} disabled={!newProjectTitle.trim()}>
                  Create Project
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Toolbar */}
      <Toolbar
        onCreateScene={handleCreateScene}
        onGenerateBranches={handleGenerateBranches}
        isGenerating={isGeneratingBranches}
      />

      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className={`flex-1 flex transition-all duration-300 ${sidebarCollapsed ? "ml-0" : "ml-80"}`}>
          {/* Story Map Canvas (70% width on desktop) */}
          <div className="flex-1 lg:w-[70%] relative">
            <StoryMap onNodeClick={setCurrentNode} onGenerateBranches={handleGenerateBranches} />
          </div>

          {/* Text Editor Panel (30% width on desktop) */}
          <div className="hidden lg:block lg:w-[30%] border-l border-gray-200">
            <TextEditor onGenerateBranches={handleGenerateBranches} isGenerating={isGeneratingBranches} />
          </div>
        </div>
      </div>

      {/* Branch Preview Panel (Bottom) */}
      {branches.length > 0 && (
        <BranchPreview options={branches} onSelect={handleBranchSelect} onClose={() => setBranches([])} />
      )}

      {/* Mobile Text Editor Modal */}
      {currentNodeId && (
        <div className="lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setCurrentNode(null)} />
          <div className="fixed bottom-0 left-0 right-0 h-1/2 bg-white z-50 rounded-t-xl shadow-2xl">
            <TextEditor
              onGenerateBranches={handleGenerateBranches}
              isGenerating={isGeneratingBranches}
              isMobile={true}
            />
          </div>
        </div>
      )}
    </div>
  )
}
