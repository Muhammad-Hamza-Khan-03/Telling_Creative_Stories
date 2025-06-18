"use client"

import { useState, useEffect } from "react"
import { useStore } from "@/store/store"
import { StoryMap } from "@/components/story-map"
import { TextEditor } from "@/components/textEditor"
import { BranchPreview } from "@/components/branch-preview"
import { Toolbar } from "@/components/toolbar"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Plus, AlertTriangle, CheckCircle2, Clock } from "lucide-react"
import { ProjectCreationModal } from "@/components/ProjectCreationModal"

/**
 * Main StoryForge Application Component
 * 
 * This component orchestrates the entire application experience. With our enhanced store
 * architecture, this component becomes much simpler - it mainly handles layout and
 * delegates all business logic to the store and specialized components.
 * 
 * The component demonstrates several key patterns:
 * - State-driven UI (components react to store changes)
 * - Progressive enhancement (features unlock as services become available)
 * - Graceful degradation (core functionality works even if AI is offline)
 */
export default function StoryForgePage() {
  const {
    // Project and content state
    currentProject,
    projects,
    nodes,
    currentNodeId,
    
    // UI state
    sidebarCollapsed,
    
    // Service health and connectivity
    serviceHealth,
    connectionError,
    isCheckingHealth,
    
    // Branch generation state (managed by store now)
    branchOptions,
    isGeneratingBranches,
    isRegeneratingBranches,
    
    // Actions - now much simpler to use
    createProject,
    addNode,
    setCurrentNode,
    checkServiceHealth,
    getProjectStats,
  } = useStore()

  // Local state for UI-only concerns
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showMobileEditor, setShowMobileEditor] = useState(false)

  const stats = getProjectStats()

  /**
   * Mobile Detection and Responsive Behavior
   * We check screen size to adapt the interface for different devices
   */
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  /**
   * Auto-show mobile editor when node is selected
   * This provides a smooth mobile experience
   */
  useEffect(() => {
    if (isMobile && currentNodeId && !showMobileEditor) {
      setShowMobileEditor(true)
    }
  }, [currentNodeId, isMobile, showMobileEditor])

  /**
   * Handle project creation with enhanced error handling
   * The store now handles all the complexity, we just need to call it
   */
  const handleCreateProject = (title: string, description: string) => {
    if (!title.trim()) {
      console.log('Empty title provided, aborting project creation')
      return
    }
    
    console.log('🎯 Creating new project:', title)
    const projectId = createProject(title, description)
    console.log('✅ Project created successfully with ID:', projectId)
    
    setShowProjectModal(false)
  }

  /**
   * Handle scene creation with smart positioning
   * The store manages the complexity, we provide good UX
   */
  const handleCreateScene = () => {
    console.log('Creating new scene, current project:', currentProject?.title)
    
    // If no project exists, prompt for project creation first
    if (!currentProject) {
      console.log('No current project, showing project creation modal')
      setShowProjectModal(true)
      return
    }

    // Generate a meaningful title based on existing content
    const title = `Scene ${nodes.length + 1}`
    console.log('Adding scene with title:', title)
    
    // Calculate smart positioning to avoid overlaps
    const baseX = 100 + (nodes.length % 4) * 300
    const baseY = 100 + Math.floor(nodes.length / 4) * 200
    const position = {
      x: baseX + (Math.random() - 0.5) * 50, // Add slight randomization
      y: baseY + (Math.random() - 0.5) * 50
    }
    
    const nodeId = addNode(title, position)
    console.log('✅ Scene created with ID:', nodeId)
    
    setCurrentNode(nodeId)
    
    // On mobile, immediately show the editor for better UX
    if (isMobile) {
      setShowMobileEditor(true)
    }
  }

  /**
   * Handle node click from story map
   * This bridges the visual interface with the content editor
   */
  const handleNodeClick = (nodeId: string) => {
    console.log('📍 Node selected from map:', nodeId)
    setCurrentNode(nodeId)
    
    if (isMobile) {
      setShowMobileEditor(true)
    }
  }

  /**
   * Handle mobile editor close
   * Returns user to the story map view
   */
  const handleMobileEditorClose = () => {
    setShowMobileEditor(false)
    setCurrentNode(null)
  }

  /**
   * Get service status for user feedback
   * This helps users understand what features are available
   */
  const getServiceStatusMessage = () => {
    if (isCheckingHealth) {
      return { 
        icon: <Clock className="w-4 h-4 animate-spin" />, 
        text: "Checking AI services...", 
        color: "text-blue-600" 
      }
    }
    
    if (connectionError) {
      return { 
        icon: <AlertTriangle className="w-4 h-4" />, 
        text: "AI services offline - basic features available", 
        color: "text-yellow-600" 
      }
    }
    
    const allHealthy = serviceHealth.system && serviceHealth.branches && serviceHealth.analytics
    if (allHealthy) {
      return { 
        icon: <CheckCircle2 className="w-4 h-4" />, 
        text: "All features ready", 
        color: "text-green-600" 
      }
    }
    
    const partiallyHealthy = serviceHealth.branches
    if (partiallyHealthy) {
      return { 
        icon: <CheckCircle2 className="w-4 h-4" />, 
        text: "AI generation ready", 
        color: "text-blue-600" 
      }
    }
    
    return { 
      icon: <AlertTriangle className="w-4 h-4" />, 
      text: "Limited functionality", 
      color: "text-red-600" 
    }
  }

  // Welcome screen for completely new users
  if (!currentProject && projects.length === 0) {
    const serviceStatus = getServiceStatusMessage()
    
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
          <p className="text-gray-600 mb-6 text-lg">
            Create your first project to start crafting your story, scene by scene.
          </p>
          
          {/* Service Status Indicator */}
          <div className={`flex items-center justify-center space-x-2 mb-6 ${serviceStatus.color}`}>
            {serviceStatus.icon}
            <span className="text-sm">{serviceStatus.text}</span>
          </div>
          
          <Button 
            onClick={() => setShowProjectModal(true)} 
            size="lg" 
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Your First Project
          </Button>
          
          {/* Feature Preview */}
          <div className="mt-8 text-sm text-gray-600 space-y-2">
            <p>✨ AI-powered story branching</p>
            <p>🎯 Visual story mapping</p>
            <p>📝 Rich text editing</p>
            <p>📊 Narrative analytics</p>
          </div>
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

  // Project selection screen for returning users
  if (!currentProject && projects.length > 0) {
    const serviceStatus = getServiceStatusMessage()
    
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Projects</h1>
            <p className="text-gray-600">Choose a project to continue working on</p>
            
            {/* Service Status for Project Selection */}
            <div className={`flex items-center justify-center space-x-2 mt-4 ${serviceStatus.color}`}>
              {serviceStatus.icon}
              <span className="text-sm">{serviceStatus.text}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-all cursor-pointer group"
                onClick={() => useStore.getState().setCurrentProject(project.id)}
              >
                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  {project.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {project.description || 'No description provided'}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    {project.genre || 'No genre'}
                  </span>
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
  
  /**
   * Main application interface
   * This is where users spend most of their time creating stories
   */
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header Toolbar - Now much simpler since it reads from store */}
      <Toolbar />

      <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden">
        {/* Sidebar - Conditionally shown based on screen size and user preference */}
        <div className={`
          ${isMobile ? 'absolute' : 'relative'} 
          ${sidebarCollapsed ? (isMobile ? '-translate-x-full' : 'w-0') : (isMobile ? 'translate-x-0' : 'w-80')}
          transition-all duration-300 ease-in-out z-30
          ${isMobile ? 'h-full' : ''}
        `}>
          <Sidebar />
        </div>

        {/* Mobile sidebar overlay - Provides modal-like behavior on mobile */}
        {isMobile && !sidebarCollapsed && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20"
            onClick={() => useStore.getState().toggleSidebar()}
          />
        )}

        {/* Main Content Area - Adapts based on branch preview state */}
        <div className={`flex-1 flex overflow-hidden transition-all duration-300 ${
          // Show branch preview panel when there are options, loading, or errors
          (branchOptions.length > 0 || isGeneratingBranches || isRegeneratingBranches) ? 'mr-80 lg:mr-96' : ''
        }`}>
          
          {/* Desktop Layout: Split between map and editor */}
          {!isMobile && (
            <>
              {/* Story Map Canvas - The visual heart of the application */}
              <div className="flex-1 min-w-0">
                <StoryMap 
                  onNodeClick={handleNodeClick}
                />
              </div>

              {/* Text Editor Panel - Dedicated writing space */}
              <div className="w-1/3 min-w-[300px] max-w-md border-l border-gray-200">
                <TextEditor 
                  onGenerateBranches={() => {}} 
                  isGenerating={false} 
                />
              </div>
            </>
          )}

          {/* Mobile Layout: Single view with navigation */}
          {isMobile && (
            <div className="flex-1">
              <StoryMap 
                onNodeClick={handleNodeClick}
              />
            </div>
          )}
        </div>

        {/* Branch Preview Panel - Shows AI-generated options */}
        {/* Note: BranchPreview now reads everything from store, no props needed */}
        <BranchPreview />
      </div>

      {/* Mobile Text Editor Modal - Full-screen editing on mobile */}
      {isMobile && showMobileEditor && currentNodeId && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex-1">
            <TextEditor 
              isMobile={true} 
              onGenerateBranches={() => {}} 
              isGenerating={false} 
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

      {/* Development Debug Information - Helpful during development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black text-white p-2 rounded text-xs z-50">
          <div>Project: {currentProject?.title || 'None'}</div>
          <div>Nodes: {nodes.length} | Current: {currentNodeId ? 'Yes' : 'No'}</div>
          <div>Mobile: {isMobile ? 'Yes' : 'No'} | AI: {serviceHealth.branches ? '✅' : '❌'}</div>
          <div>Generating: {isGeneratingBranches ? '⏳' : '✅'} | Options: {branchOptions.length}</div>
        </div>
      )}
    </div>
  )
}