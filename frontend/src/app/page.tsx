"use client"

import { useState, useEffect } from "react"
import { useStore } from "@/store/store"
import { StoryMap } from "@/components/story-map"
import { TextEditor } from "@/components/textEditor"
import { BranchPreview } from "@/components/branch-preview"
import { Toolbar } from "@/components/toolbar"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, X } from "lucide-react"
import { ProjectCreationModal } from "@/components/ProjectCreationModal"
import { ThemeProvider } from "@/utils/themes"

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
    activeView,
    setActiveView,
    getProjectStats,
  } = useStore()

  const [showProjectModal, setShowProjectModal] = useState(false)
  const [newProjectTitle, setNewProjectTitle] = useState("")
  const [newProjectDescription, setNewProjectDescription] = useState("")
  
  // Branch generation state
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

  // Mobile state
  const [isMobile, setIsMobile] = useState(false)
  const [showMobileEditor, setShowMobileEditor] = useState(false)

  const stats = getProjectStats()

  // Check for mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Auto-show mobile editor when node is selected on mobile
  useEffect(() => {
    if (isMobile && currentNodeId && !showMobileEditor) {
      setShowMobileEditor(true)
    }
  }, [currentNodeId, isMobile, showMobileEditor])

  // Handle project creation
  const handleCreateProject = () => {
    if (!newProjectTitle.trim()) return
    
    console.log('Creating project:', newProjectTitle)
    const projectId = createProject(newProjectTitle, newProjectDescription)
    console.log('Project created with ID:', projectId)
    
    setNewProjectTitle("")
    setNewProjectDescription("")
    setShowProjectModal(false)
  }

  // Handle scene creation
  const handleCreateScene = () => {
    console.log('Creating scene, current project:', currentProject?.title)
    
    if (!currentProject) {
      console.log('No current project, showing modal')
      setShowProjectModal(true)
      return
    }

    const title = `Scene ${nodes.length + 1}`
    console.log('Adding node with title:', title)
    
    // Create node at a position that spreads them out nicely
    const baseX = 100 + (nodes.length % 4) * 300
    const baseY = 100 + Math.floor(nodes.length / 4) * 200
    const position = {
      x: baseX + (Math.random() - 0.5) * 50, // Add small random offset
      y: baseY + (Math.random() - 0.5) * 50
    }
    
    const nodeId = addNode(title, position)
    console.log('Node created with ID:', nodeId)
    
    setCurrentNode(nodeId)
    
    // On mobile, show the editor
    if (isMobile) {
      setShowMobileEditor(true)
    }
  }

  // Handle branch generation (mock AI integration)
  const handleGenerateBranches = async () => {
    const currentNode = nodes.find((n) => n.id === currentNodeId)
    if (!currentNode) {
      console.log('No current node for branch generation')
      return
    }

    console.log('Generating branches for node:', currentNode.title)
    setIsGeneratingBranches(true)

    // Mock AI branch generation with more realistic delay
    setTimeout(() => {
      const mockBranches = [
        {
          id: "1",
          title: "The Mysterious Discovery",
          summary: "The character finds something unexpected that changes everything.",
          content: `As ${currentNode.title} concluded, a glimmer caught their eye. Hidden beneath the old floorboards was something that would change the course of their entire journey. The discovery was both thrilling and terrifying.`,
          characters: ["Protagonist", "Mysterious Figure"],
          impact: "High",
          tags: ["mystery", "discovery", "plot-twist"],
        },
        {
          id: "2",
          title: "An Unexpected Visitor",
          summary: "Someone arrives unexpectedly, bringing news or complications.",
          content: `Just as peace seemed to settle over the scene, a knock echoed through the house. The visitor at the door brought news that no one was prepared to hear, setting into motion events that couldn't be undone.`,
          characters: ["Protagonist", "Visitor", "Messenger"],
          impact: "Medium",
          tags: ["surprise", "visitor", "news"],
        },
        {
          id: "3",
          title: "Internal Reflection",
          summary: "A quiet moment for character development and introspection.",
          content: `In the stillness that followed, there was time to think. The events of recent days had changed everything, and now came the difficult task of understanding what it all meant and what choices lay ahead.`,
          characters: ["Protagonist"],
          impact: "Low",
          tags: ["reflection", "character-development", "introspection"],
        },
      ]

      setBranches(mockBranches)
      setIsGeneratingBranches(false)
      console.log('Branches generated:', mockBranches.length)
    }, 2000)
  }

  // Handle branch selection
  const handleBranchSelect = (branch: any) => {
    console.log('Branch selected:', branch.title)
    
    // Create position relative to current node
    const currentNode = nodes.find(n => n.id === currentNodeId)
    const basePosition = currentNode ? currentNode.position : { x: 300, y: 300 }
    
    const position = {
      x: basePosition.x + 250 + Math.random() * 100,
      y: basePosition.y + (Math.random() - 0.5) * 200
    }
    
    const nodeId = addNode(branch.title, position)

    // Connect to current node if one exists
    if (currentNodeId) {
      useStore.getState().connectNodes(currentNodeId, nodeId)
    }

    // Set content and switch to new node
    useStore.getState().updateNodeContent(nodeId, branch.content)
    useStore.getState().updateNodeStatus(nodeId, 'suggestion')
    setCurrentNode(nodeId)
    setBranches([]) // Clear branches after selection
    
    // On mobile, keep editor open
    if (isMobile) {
      setShowMobileEditor(true)
    }
  }

  // Handle node click from map
  const handleNodeClick = (nodeId: string) => {
    console.log('Node clicked from map:', nodeId)
    setCurrentNode(nodeId)
    
    if (isMobile) {
      setShowMobileEditor(true)
    }
  }

  // Handle mobile editor close
  const handleMobileEditorClose = () => {
    setShowMobileEditor(false)
    setCurrentNode(null)
  }

  // Welcome screen for new users
  if (!currentProject && projects.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
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
          <Button 
            onClick={() => setShowProjectModal(true)} 
            size="lg" 
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Your First Project
          </Button>
        </div>

        {/* Project Creation Modal */}
        {showProjectModal && (
          <ProjectCreationModal
            isOpen={showProjectModal}
            onClose={() => setShowProjectModal(false)}
            onCreateProject={handleCreateProject}
          />
        )}
      </div>
    )
  }

  // Project selection screen
  if (!currentProject && projects.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Projects</h1>
            <p className="text-gray-600">Choose a project to continue working on</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => useStore.getState().setCurrentProject(project.id)}
              >
                <h3 className="font-semibold text-gray-900 mb-2">{project.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{project.description || 'No description'}</p>
                <div className="text-xs text-gray-500">
                  Created {new Date(project.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <Button 
              onClick={() => setShowProjectModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>
        
        {showProjectModal && (
          <ProjectCreationModal
            isOpen={showProjectModal}
            onClose={() => setShowProjectModal(false)}
            onCreateProject={handleCreateProject}
          />
        )}
      </div>
    )
  }


  // Project Creation Modal Component
  
  // Main app interface
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header Toolbar */}
      <ThemeProvider>
      <Toolbar
        onCreateScene={handleCreateScene}
        onGenerateBranches={handleGenerateBranches}
        isGenerating={isGeneratingBranches}
      />
</ThemeProvider>
      <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden">
        {/* Sidebar - hidden on mobile when collapsed */}
        <div className={`
          ${isMobile ? 'absolute' : 'relative'} 
          ${sidebarCollapsed ? (isMobile ? '-translate-x-full' : 'w-0') : (isMobile ? 'translate-x-0' : 'w-80')}
          transition-all duration-300 ease-in-out z-30
          ${isMobile ? 'h-full' : ''}
        `}>
          <Sidebar />
        </div>

        {/* Mobile sidebar overlay */}
        {isMobile && !sidebarCollapsed && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20"
            onClick={() => toggleSidebar()}
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Desktop: Split view */}
          {!isMobile && (
            <>
              {/* Story Map Canvas */}
              <div className="flex-1 min-w-0">
                <StoryMap 
                  onNodeClick={handleNodeClick} 
                  onGenerateBranches={handleGenerateBranches} 
                />
              </div>

              {/* Text Editor Panel */}
              <div className="w-1/3 min-w-[300px] max-w-md border-l border-gray-200">
                <TextEditor 
                  onGenerateBranches={handleGenerateBranches} 
                  isGenerating={isGeneratingBranches} 
                />
              </div>
            </>
          )}

          {/* Mobile: Single view */}
          {isMobile && (
            <div className="flex-1">
              <StoryMap 
                onNodeClick={handleNodeClick} 
                onGenerateBranches={handleGenerateBranches} 
              />
            </div>
          )}
        </div>
      </div>

      {/* Branch Preview Panel */}
      {branches.length > 0 && (
        <BranchPreview 
          options={branches} 
          onSelect={handleBranchSelect} 
          onClose={() => setBranches([])} 
        />
      )}

      {/* Mobile Text Editor Modal */}
      {isMobile && showMobileEditor && currentNodeId && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex-1">
            <TextEditor
              onGenerateBranches={handleGenerateBranches}
              isGenerating={isGeneratingBranches}
              isMobile={true}
            />
          </div>
          <div className="p-4 border-t bg-gray-50">
            <Button 
              onClick={handleMobileEditorClose}
              variant="outline"
              className="w-full"
            >
              Back to Map
            </Button>
          </div>
        </div>
      )}

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black text-white p-2 rounded text-xs z-50">
          Project: {currentProject?.title || 'None'} | 
          Nodes: {nodes.length} | 
          Current: {currentNodeId ? 'Yes' : 'No'} |
          Mobile: {isMobile ? 'Yes' : 'No'}
        </div>
      )}
    </div>
  )
}

