// app/page.tsx - Enhanced with branch-aware story structure visualization
// This builds on your existing page layout while adding sophisticated narrative intelligence

"use client"

import { useState, useEffect } from "react"
import { useStore } from "@/store/store"
import { StoryMap } from "@/components/story-map"
import { TextEditor } from "@/components/textEditor"
import { BranchPreview } from "@/components/branch-preview"
import { Toolbar } from "@/components/toolbar"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, AlertTriangle, CheckCircle2, Clock, GitBranch, BarChart3, Map, BookOpen, X } from "lucide-react"
import { ProjectCreationModal } from "@/components/ProjectCreationModal"

// Import the new branch visualization components
import { 
  BranchOverviewPanel, 
  BranchListPanel, 
  BranchNavigator, 
  StoryStructureVisualization 
} from "@/components/story-branches"

/**
 * Enhanced StoryForge Application Component
 * 
 * This maintains all your existing functionality while adding branch awareness throughout.
 * The key insight is that we're enhancing rather than replacing - your story map, editor,
 * and basic workflows remain identical, but now they're enhanced with narrative intelligence.
 * 
 * New features added:
 * - Branch structure visualization in sidebar
 * - Narrative context awareness in editor
 * - Story path navigation and export options
 * - Enhanced analytics panel that understands branching narratives
 */
export default function StoryForgePage() {
  const {
    // Existing state - unchanged interface
    currentProject,
    projects,
    nodes,
    currentNodeId,
    sidebarCollapsed,
    
    // Enhanced state - new branch awareness
    storyStructure,
    currentBranchId,
    isAnalyzingStructure,
    
    // Service health and connectivity (existing)
    serviceHealth,
    connectionError,
    isCheckingHealth,
    
    // Branch generation state (existing, now enhanced)
    branchOptions,
    isGeneratingBranches,
    isRegeneratingBranches,
    
    // Actions - mix of existing and enhanced
    createProject,
    addNode,
    setCurrentNode,
    checkServiceHealth,
    getProjectStats,
    
    // New branch-aware actions
    analyzeStoryStructure,
    getBranchContainingNode,
  } = useStore()

  // Existing UI state - unchanged
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showMobileEditor, setShowMobileEditor] = useState(false)
  
  // New UI state for branch visualization panels
  const [showBranchPanel, setShowBranchPanel] = useState(false)
  const [branchPanelMode, setBranchPanelMode] = useState<'overview' | 'list' | 'structure'>('overview')

  const stats = getProjectStats()

  /**
   * Mobile Detection and Responsive Behavior (unchanged from your original)
   */
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  /**
   * Auto-show mobile editor when node is selected (unchanged)
   */
  useEffect(() => {
    if (isMobile && currentNodeId && !showMobileEditor) {
      setShowMobileEditor(true)
    }
  }, [currentNodeId, isMobile, showMobileEditor])

  /**
   * NEW: Auto-analyze story structure when nodes change
   * This runs in the background to keep branch analysis current
   */
  useEffect(() => {
    if (nodes.length > 0 && !storyStructure && !isAnalyzingStructure) {
      console.log('🔍 Auto-triggering structure analysis for', nodes.length, 'nodes')
      analyzeStoryStructure()
    }
  }, [nodes.length, storyStructure, isAnalyzingStructure, analyzeStoryStructure])

  /**
   * Enhanced project creation (unchanged logic, same interface)
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
   * Enhanced scene creation (unchanged interface, now triggers structure analysis)
   */
  const handleCreateScene = () => {
    console.log('Creating new scene, current project:', currentProject?.title)
    
    if (!currentProject) {
      console.log('No current project, showing project creation modal')
      setShowProjectModal(true)
      return
    }

    const title = `Scene ${nodes.length + 1}`
    console.log('Adding scene with title:', title)
    
    // Smart positioning based on existing structure
    const baseX = 100 + (nodes.length % 4) * 300
    const baseY = 100 + Math.floor(nodes.length / 4) * 200
    const position = {
      x: baseX + (Math.random() - 0.5) * 50,
      y: baseY + (Math.random() - 0.5) * 50
    }
    
    const nodeId = addNode(title, position)
    console.log('✅ Scene created with ID:', nodeId)
    
    setCurrentNode(nodeId)
    
    if (isMobile) {
      setShowMobileEditor(true)
    }
  }

  /**
   * Enhanced node click handler (unchanged interface)
   */
  const handleNodeClick = (nodeId: string) => {
    console.log('📍 Node selected from map:', nodeId)
    setCurrentNode(nodeId)
    
    if (isMobile) {
      setShowMobileEditor(true)
    }
  }

  /**
   * Mobile editor close handler (unchanged)
   */
  const handleMobileEditorClose = () => {
    setShowMobileEditor(false)
    setCurrentNode(null)
  }

  /**
   * Enhanced service status (unchanged logic, now aware of structure analysis)
   */
  const getServiceStatusMessage = () => {
    if (isCheckingHealth || isAnalyzingStructure) {
      return { 
        icon: <Clock className="w-4 h-4 animate-spin" />, 
        text: isAnalyzingStructure ? "Analyzing story structure..." : "Checking AI services...", 
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

  /**
   * NEW: Branch panel toggle handlers
   * These provide easy access to different views of story structure
   */
  const handleToggleBranchPanel = (mode: 'overview' | 'list' | 'structure') => {
    if (showBranchPanel && branchPanelMode === mode) {
      setShowBranchPanel(false)
    } else {
      setBranchPanelMode(mode)
      setShowBranchPanel(true)
    }
  }

  /**
   * NEW: Get current branch context for display
   * This helps users understand their narrative position
   */
  const getCurrentBranchContext = () => {
    if (!currentNodeId || !storyStructure) return null
    
    const currentBranch = getBranchContainingNode(currentNodeId)
    if (!currentBranch) return null
    
    const nodeIndex = currentBranch.nodes.findIndex(node => node.id === currentNodeId)
    const isMainBranch = currentBranch.id === storyStructure.mainBranch.id
    
    return {
      branch: currentBranch,
      nodeIndex,
      isMainBranch,
      progress: Math.round(((nodeIndex + 1) / currentBranch.nodes.length) * 100)
    }
  }

  const branchContext = getCurrentBranchContext()

  // Welcome screen for completely new users (unchanged)
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
          
          <div className="mt-8 text-sm text-gray-600 space-y-2">
            <p>✨ AI-powered story branching</p>
            <p>🎯 Visual story mapping</p>
            <p>📝 Rich text editing</p>
            <p>📊 Narrative analytics</p>
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

  // Project selection screen (unchanged)
  if (!currentProject && projects.length > 0) {
    const serviceStatus = getServiceStatusMessage()
    
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Projects</h1>
            <p className="text-gray-600">Choose a project to continue working on</p>
            
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
   * MAIN APPLICATION INTERFACE - Enhanced with branch awareness
   * 
   * The structure remains identical to your original, but now includes
   * branch visualization panels and narrative context awareness throughout.
   */
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header Toolbar - Enhanced to show branch context */}
      <Toolbar />

      {/* NEW: Branch Context Bar - Shows when user is working within a specific narrative branch */}
      {branchContext && !isMobile && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
          <div className="flex items-center justify-between max-w-full">
            <BranchNavigator />
            
            <div className="flex items-center space-x-3">
              {/* Branch visualization toggle buttons */}
              <div className="flex items-center space-x-1 bg-white rounded-md p-1">
                <Button
                  variant={showBranchPanel && branchPanelMode === 'overview' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleToggleBranchPanel('overview')}
                  className="h-7 px-2"
                  title="Story structure overview"
                >
                  <GitBranch className="w-3 h-3" />
                </Button>
                <Button
                  variant={showBranchPanel && branchPanelMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleToggleBranchPanel('list')}
                  className="h-7 px-2"
                  title="List all story branches"
                >
                  <BookOpen className="w-3 h-3" />
                </Button>
                <Button
                  variant={showBranchPanel && branchPanelMode === 'structure' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleToggleBranchPanel('structure')}
                  className="h-7 px-2"
                  title="Visual structure diagram"
                >
                  <BarChart3 className="w-3 h-3" />
                </Button>
              </div>
              
              <div className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">
                {branchContext.progress}% through {branchContext.isMainBranch ? 'main story' : 'branch'}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden relative">
        {/* Enhanced Sidebar - Now includes branch overview */}
        <div className={`
          ${isMobile ? 'absolute' : 'relative'} 
          ${sidebarCollapsed ? (isMobile ? '-translate-x-full' : 'w-0') : (isMobile ? 'translate-x-0' : 'w-80')}
          transition-all duration-300 ease-in-out z-30
          ${isMobile ? 'h-full' : ''}
        `}>
          <div className="h-full flex flex-col">
            {/* Original Sidebar */}
            <div className="flex-1 min-h-0">
              <Sidebar />
            </div>
            
            {/* NEW: Branch Overview in Sidebar (only on desktop) */}
            {!isMobile && !sidebarCollapsed && storyStructure && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <BranchOverviewPanel />
              </div>
            )}
          </div>
        </div>

        {/* Mobile sidebar overlay (unchanged) */}
        {isMobile && !sidebarCollapsed && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20"
            onClick={() => useStore.getState().toggleSidebar()}
          />
        )}

        {/* NEW: Branch Analysis Panel - Collapsible side panel for detailed branch view */}
        {showBranchPanel && !isMobile && (
          <div className="w-80 border-r border-gray-200 bg-white z-10 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-900">
                {branchPanelMode === 'overview' && 'Story Structure'}
                {branchPanelMode === 'list' && 'Story Branches'}
                {branchPanelMode === 'structure' && 'Structure Diagram'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBranchPanel(false)}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {branchPanelMode === 'overview' && <BranchOverviewPanel />}
              {branchPanelMode === 'list' && <BranchListPanel />}
              {branchPanelMode === 'structure' && <StoryStructureVisualization />}
            </div>
          </div>
        )}

        {/* Main Content Area - Enhanced calculations for new panels */}
        <div className={`flex-1 flex overflow-hidden transition-all duration-300 ${
          // Adjust for both branch panel and branch preview
          (showBranchPanel ? 'ml-0' : '') +
          ((branchOptions.length > 0 || isGeneratingBranches || isRegeneratingBranches) ? ' mr-80 lg:mr-96' : '')
        }`}>
          
          {/* Desktop Layout: Split between map and editor (enhanced with branch context) */}
          {!isMobile && (
            <>
              {/* Story Map Canvas - Enhanced with branch awareness */}
              <div className="flex-1 min-w-0 relative">
                <StoryMap 
                  onNodeClick={handleNodeClick}
                />
                
                {/* NEW: Branch structure overlay for empty stories */}
                {nodes.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-90">
                    <div className="text-center max-w-md">
                      <GitBranch className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Your Story Canvas</h3>
                      <p className="text-gray-600 mb-6">
                        Create scenes and connect them to build branching narratives
                      </p>
                      <Button 
                        onClick={handleCreateScene}
                        className="mb-4 bg-indigo-600 hover:bg-indigo-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Scene
                      </Button>
                      <div className="space-y-2 text-sm text-gray-500">
                        <p>💡 <strong>Tip:</strong> Connect scenes to create story flow</p>
                        <p>🎭 <strong>Tip:</strong> Multiple connections create branching narratives</p>
                        <p>✨ <strong>Tip:</strong> Use AI to generate story branches</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Text Editor Panel - Enhanced with branch context */}
              <div className="w-1/3 min-w-[300px] max-w-md border-l border-gray-200 flex flex-col">
                {/* NEW: Branch Navigator in Editor Header */}
                {branchContext && (
                  <div className="border-b border-gray-200 p-3 bg-blue-50">
                    <BranchNavigator />
                  </div>
                )}
                
                <div className="flex-1">
                  <TextEditor 
                    onGenerateBranches={() => {}} 
                    isGenerating={false} 
                  />
                </div>
              </div>
            </>
          )}

          {/* Mobile Layout: Single view with navigation (enhanced with branch awareness) */}
          {isMobile && (
            <div className="flex-1 relative">
              <StoryMap 
                onNodeClick={handleNodeClick}
              />
              
              {/* NEW: Mobile Branch Context Indicator */}
              {branchContext && (
                <div className="absolute top-4 left-4 right-4 z-10">
                  <Card className="bg-white/90 backdrop-blur-sm">
                    <CardContent className="p-3">
                      <BranchNavigator />
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {/* Mobile Branch Panel Toggle */}
              {storyStructure && (
                <div className="absolute bottom-20 right-4 z-10">
                  <Button
                    onClick={() => setShowBranchPanel(!showBranchPanel)}
                    className="bg-indigo-600 hover:bg-indigo-700 shadow-lg"
                    size="sm"
                  >
                    <GitBranch className="w-4 h-4 mr-2" />
                    Branches
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Branch Preview Panel - Enhanced positioning */}
        <BranchPreview />
      </div>

      {/* Mobile Branch Panel - Full screen overlay */}
      {showBranchPanel && isMobile && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Story Structure</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBranchPanel(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Branch panel mode selector */}
          <div className="flex border-b bg-white">
            {[
              { mode: 'overview' as const, label: 'Overview', icon: GitBranch },
              { mode: 'list' as const, label: 'Branches', icon: BookOpen },
              { mode: 'structure' as const, label: 'Structure', icon: BarChart3 },
            ].map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => setBranchPanelMode(mode)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 text-sm font-medium transition-colors ${
                  branchPanelMode === mode
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {branchPanelMode === 'overview' && <BranchOverviewPanel />}
            {branchPanelMode === 'list' && <BranchListPanel />}
            {branchPanelMode === 'structure' && <StoryStructureVisualization />}
          </div>
        </div>
      )}

      {/* Mobile Text Editor Modal - Enhanced with branch context */}
      {isMobile && showMobileEditor && currentNodeId && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          {/* Enhanced mobile editor header with branch context */}
          {branchContext && (
            <div className="border-b border-gray-200 p-3 bg-blue-50">
              <BranchNavigator />
            </div>
          )}
          
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
              <Map className="w-4 h-4 mr-2" />
              Back to Story Map
            </Button>
          </div>
        </div>
      )}

      {/* Enhanced Development Debug Information */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black text-white p-2 rounded text-xs z-50 space-y-1">
          <div>Project: {currentProject?.title || 'None'}</div>
          <div>Nodes: {nodes.length} | Current: {currentNodeId ? 'Yes' : 'No'}</div>
          <div>Mobile: {isMobile ? 'Yes' : 'No'} | AI: {serviceHealth.branches ? '✅' : '❌'}</div>
          <div>Generating: {isGeneratingBranches ? '⏳' : '✅'} | Options: {branchOptions.length}</div>
          {/* NEW: Branch analysis debug info */}
          <div>Structure: {storyStructure ? `${storyStructure.totalBranches} branches` : 'Not analyzed'}</div>
          <div>Current Branch: {currentBranchId ? currentBranchId.slice(0, 8) : 'None'}</div>
          {branchContext && (
            <div>Branch Progress: {branchContext.progress}% ({branchContext.nodeIndex + 1}/{branchContext.branch.nodes.length})</div>
          )}
        </div>
      )}
    </div>
  )
}