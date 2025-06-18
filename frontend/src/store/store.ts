import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { subscribeWithSelector } from "zustand/middleware"
import { v4 as uuidv4 } from "uuid"

// Import our API service layer
import { 
  branchService, 
  analyticsService, 
  healthService, 
  BranchOption, 
  getErrorMessage,
  APIError 
} from '@/lib/api'

// Types and Interfaces - These define the shape of our data
export interface StoryNode {
  id: string
  content: string
  title: string
  position: { x: number; y: number }
  connections: string[]
  status: "draft" | "written" | "suggestion"
  createdAt: Date
  updatedAt: Date
  wordCount: number
  characterCount: number
  tags: string[]
  notes: string
}

export interface StoryProject {
  id: string
  title: string
  description: string
  createdAt: Date
  updatedAt: Date
  genre: string
  targetWordCount?: number
}

export interface EditorSettings {
  fontSize: number
  fontFamily: "serif" | "sans-serif" | "mono"
  lineHeight: number
  autoSave: boolean
  autoSaveDelay: number
  showWordCount: boolean
  showLineNumbers: boolean
  darkMode: boolean
  fullscreenMode: boolean
}

// Enhanced interface that includes both original functionality and new API features
export interface StoryState {
  // Project data - manages multiple writing projects
  currentProject: StoryProject | null
  projects: StoryProject[]

  // Story data - the core content management
  nodes: StoryNode[]
  currentNodeId: string | null
  selectedNodeIds: string[]

  // Editor state - writing interface preferences
  isEditing: boolean
  editorSettings: EditorSettings

  // UI state - interface layout and navigation
  sidebarCollapsed: boolean
  activeView: "editor" | "flow" | "outline"

  // History for undo/redo - enables user mistake recovery
  history: {
    past: StoryNode[][]
    present: StoryNode[]
    future: StoryNode[][]
  }

  // API Loading States - track ongoing operations for UI feedback
  isGeneratingBranches: boolean
  isRegeneratingBranches: boolean
  isAnalyzingStory: boolean
  isCheckingHealth: boolean

  // Error States - user-friendly error messages for different operations
  branchGenerationError: string | null
  analysisError: string | null
  connectionError: string | null

  // Branch Generation Results - AI-generated story options
  branchOptions: BranchOption[]
  lastBranchGenerationTime: number | null

  // Service Health Status - monitor backend availability
  serviceHealth: {
    system: boolean
    branches: boolean
    analytics: boolean
    lastChecked: Date | null
  }

  // Analysis Results - Narrative DNA and insights
  lastAnalysis: any | null
  quickInsights: any | null

  // Actions - Project Management
  createProject: (title: string, description?: string) => string
  updateProject: (id: string, updates: Partial<StoryProject>) => void
  deleteProject: (id: string) => void
  setCurrentProject: (id: string | null) => void

  // Actions - Node Management
  addNode: (title: string, position?: { x: number; y: number }) => string
  updateNodeContent: (id: string, content: string) => void
  updateNodeTitle: (id: string, title: string) => void
  updateNodeStatus: (id: string, status: StoryNode["status"]) => void
  updateNodePosition: (id: string, position: { x: number; y: number }) => void
  updateNodeNotes: (id: string, notes: string) => void
  addNodeTag: (id: string, tag: string) => void
  removeNodeTag: (id: string, tag: string) => void
  connectNodes: (fromId: string, toId: string) => void
  disconnectNodes: (fromId: string, toId: string) => void
  deleteNode: (id: string) => void
  duplicateNode: (id: string) => string

  // Actions - Selection and Navigation
  setCurrentNode: (id: string | null) => void
  selectNode: (id: string, multiSelect?: boolean) => void
  clearSelection: () => void
  selectAll: () => void

  // Actions - Editor
  setIsEditing: (editing: boolean) => void
  updateEditorSettings: (settings: Partial<EditorSettings>) => void
  toggleSidebar: () => void
  setActiveView: (view: "editor" | "flow" | "outline") => void

  // Actions - History
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  saveToHistory: () => void

  // Actions - Bulk Operations
  deleteSelectedNodes: () => void
  updateSelectedNodesStatus: (status: StoryNode["status"]) => void
  moveSelectedNodes: (deltaX: number, deltaY: number) => void

  // Actions - Import/Export
  exportProject: () => string
  importProject: (data: string) => void
  exportNode: (id: string) => string
  importNode: (data: string, position?: { x: number; y: number }) => string

  // Enhanced API Actions - AI Integration
  generateBranches: (nodeId: string, options?: {
    regenerate?: boolean
    genre?: string
    tone?: string
  }) => Promise<void>
  selectBranch: (branch: BranchOption, parentNodeId: string) => void
  clearBranchOptions: () => void
  analyzeStory: () => Promise<any>
  getQuickInsights: () => Promise<any>
  checkServiceHealth: () => Promise<void>
  clearError: (errorType: 'branch' | 'analysis' | 'connection') => void

  // Getters - computed values based on current state
  getCurrentNode: () => StoryNode | null
  getNodeById: (id: string) => StoryNode | null
  getConnectedNodes: (id: string) => StoryNode[]
  getSelectedNodes: () => StoryNode[]
  getProjectStats: () => {
    totalNodes: number
    writtenNodes: number
    draftNodes: number
    suggestionNodes: number
    totalWords: number
    totalCharacters: number
  }
  searchNodes: (query: string) => StoryNode[]
  getNodesByTag: (tag: string) => StoryNode[]
  getNodesByStatus: (status: StoryNode["status"]) => StoryNode[]
  extractCharacterNames: () => string[]
}

// Default settings - sensible defaults for new users
const defaultEditorSettings: EditorSettings = {
  fontSize: 16,
  fontFamily: "serif",
  lineHeight: 1.6,
  autoSave: true,
  autoSaveDelay: 1000,
  showWordCount: true,
  showLineNumbers: false,
  darkMode: false,
  fullscreenMode: false,
}

// Helper functions - pure functions that don't depend on state
const calculateWordCount = (content: string): number => {
  if (!content || content.trim() === '') return 0
  // Remove HTML tags and count words properly
  const text = content.replace(/<[^>]*>/g, '').trim()
  if (!text) return 0
  return text.split(/\s+/).filter((word) => word.length > 0).length
}

const createNewNode = (title: string, position: { x: number; y: number }): StoryNode => {
  const now = new Date()
  return {
    id: uuidv4(),
    title: title || `Scene ${Math.floor(Math.random() * 1000)}`,
    content: "",
    position,
    connections: [],
    status: "draft",
    createdAt: now,
    updatedAt: now,
    wordCount: 0,
    characterCount: 0,
    tags: [],
    notes: "",
  }
}

const createNewProject = (title: string, description = ""): StoryProject => {
  const now = new Date()
  return {
    id: uuidv4(),
    title: title || "Untitled Project",
    description,
    createdAt: now,
    updatedAt: now,
    genre: "",
    targetWordCount: undefined,
  }
}

// Main Store Creation - This is where all the magic happens
export const useStore = create<StoryState>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // Initialize all state properties
      currentProject: null,
      projects: [],
      nodes: [],
      currentNodeId: null,
      selectedNodeIds: [],
      isEditing: false,
      editorSettings: defaultEditorSettings,
      sidebarCollapsed: false,
      activeView: "editor",
      history: {
        past: [],
        present: [],
        future: [],
      },

      // Initialize API-related state
      isGeneratingBranches: false,
      isRegeneratingBranches: false,
      isAnalyzingStory: false,
      isCheckingHealth: false,
      branchGenerationError: null,
      analysisError: null,
      connectionError: null,
      branchOptions: [],
      lastBranchGenerationTime: null,
      serviceHealth: {
        system: false,
        branches: false,
        analytics: false,
        lastChecked: null,
      },
      lastAnalysis: null,
      quickInsights: null,

      // Project Management Actions
      createProject: (title: string, description = "") => {
        console.log('🎯 Creating project:', title)
        const project = createNewProject(title, description)
        set((state) => {
          state.projects.push(project)
          state.currentProject = project
        })
        return project.id
      },

      updateProject: (id: string, updates: Partial<StoryProject>) => {
        set((state) => {
          const project = state.projects.find((p) => p.id === id)
          if (project) {
            Object.assign(project, updates, { updatedAt: new Date() })
            if (state.currentProject?.id === id) {
              state.currentProject = project
            }
          }
        })
      },

      deleteProject: (id: string) => {
        set((state) => {
          state.projects = state.projects.filter((p) => p.id !== id)
          if (state.currentProject?.id === id) {
            state.currentProject = null
            state.nodes = []
            state.currentNodeId = null
            state.selectedNodeIds = []
          }
        })
      },

      setCurrentProject: (id: string | null) => {
        set((state) => {
          const project = id ? state.projects.find((p) => p.id === id) : null
          state.currentProject = project || null
        })
      },

      // Node Management Actions
      addNode: (title: string, position = { x: 0, y: 0 }) => {
        console.log('📝 Adding node:', title, position)
        
        // Ensure we have a current project
        if (!get().currentProject) {
          console.warn('No current project, creating default project')
          get().createProject('My Story')
        }

        const node = createNewNode(title, position)
        
        set((state) => {
          // Save current state to history before making changes
          if (state.nodes.length > 0) {
            state.history.past.push([...state.nodes])
            if (state.history.past.length > 50) {
              state.history.past.shift()
            }
            state.history.future = []
          }
          
          state.nodes.push(node)
        })
        
        return node.id
      },

      updateNodeContent: (id: string, content: string) => {
        set((state) => {
          const node = state.nodes.find((n) => n.id === id)
          if (node) {
            node.content = content
            node.wordCount = calculateWordCount(content)
            node.characterCount = content.length
            node.updatedAt = new Date()
            if (content.trim() && node.status === "draft") {
              node.status = "written"
            }
          }
        })
      },

      updateNodeTitle: (id: string, title: string) => {
        set((state) => {
          const node = state.nodes.find((n) => n.id === id)
          if (node) {
            node.title = title || 'Untitled Scene'
            node.updatedAt = new Date()
          }
        })
      },

      updateNodeStatus: (id: string, status: StoryNode["status"]) => {
        set((state) => {
          const node = state.nodes.find((n) => n.id === id)
          if (node) {
            node.status = status
            node.updatedAt = new Date()
          }
        })
      },

      updateNodePosition: (id: string, position: { x: number; y: number }) => {
        set((state) => {
          const node = state.nodes.find((n) => n.id === id)
          if (node) {
            node.position = position
            node.updatedAt = new Date()
          }
        })
      },

      updateNodeNotes: (id: string, notes: string) => {
        set((state) => {
          const node = state.nodes.find((n) => n.id === id)
          if (node) {
            node.notes = notes
            node.updatedAt = new Date()
          }
        })
      },

      addNodeTag: (id: string, tag: string) => {
        set((state) => {
          const node = state.nodes.find((n) => n.id === id)
          if (node && !node.tags.includes(tag)) {
            node.tags.push(tag)
            node.updatedAt = new Date()
          }
        })
      },

      removeNodeTag: (id: string, tag: string) => {
        set((state) => {
          const node = state.nodes.find((n) => n.id === id)
          if (node) {
            node.tags = node.tags.filter((t) => t !== tag)
            node.updatedAt = new Date()
          }
        })
      },

      connectNodes: (fromId: string, toId: string) => {
        console.log('🔗 Connecting nodes:', fromId, 'to', toId)
        set((state) => {
          // Save to history before making connection changes
          state.history.past.push([...state.nodes])
          if (state.history.past.length > 50) {
            state.history.past.shift()
          }
          state.history.future = []

          const fromNode = state.nodes.find((n) => n.id === fromId)
          if (fromNode && !fromNode.connections.includes(toId)) {
            fromNode.connections.push(toId)
            fromNode.updatedAt = new Date()
          }
        })
      },

      disconnectNodes: (fromId: string, toId: string) => {
        set((state) => {
          // Save to history
          state.history.past.push([...state.nodes])
          if (state.history.past.length > 50) {
            state.history.past.shift()
          }
          state.history.future = []

          const fromNode = state.nodes.find((n) => n.id === fromId)
          if (fromNode) {
            fromNode.connections = fromNode.connections.filter((id) => id !== toId)
            fromNode.updatedAt = new Date()
          }
        })
      },

      deleteNode: (id: string) => {
        set((state) => {
          // Save to history
          state.history.past.push([...state.nodes])
          if (state.history.past.length > 50) {
            state.history.past.shift()
          }
          state.history.future = []

          // Remove the node
          state.nodes = state.nodes.filter((n) => n.id !== id)

          // Remove connections to this node
          state.nodes.forEach((node) => {
            node.connections = node.connections.filter((connId) => connId !== id)
          })

          // Clear current node if it was deleted
          if (state.currentNodeId === id) {
            state.currentNodeId = null
          }

          // Remove from selection
          state.selectedNodeIds = state.selectedNodeIds.filter((nodeId) => nodeId !== id)
        })
      },

      duplicateNode: (id: string) => {
        const originalNode = get().getNodeById(id)
        if (!originalNode) return ""

        const duplicatedNode = createNewNode(`${originalNode.title} (Copy)`, {
          x: originalNode.position.x + 50,
          y: originalNode.position.y + 50,
        })
        duplicatedNode.content = originalNode.content
        duplicatedNode.status = originalNode.status
        duplicatedNode.tags = [...originalNode.tags]
        duplicatedNode.notes = originalNode.notes
        duplicatedNode.wordCount = originalNode.wordCount
        duplicatedNode.characterCount = originalNode.characterCount

        set((state) => {
          // Save to history
          state.history.past.push([...state.nodes])
          if (state.history.past.length > 50) {
            state.history.past.shift()
          }
          state.history.future = []

          state.nodes.push(duplicatedNode)
        })

        return duplicatedNode.id
      },

      // Selection and Navigation Actions
      setCurrentNode: (id: string | null) => {
        console.log('🎯 Setting current node:', id)
        set((state) => {
          state.currentNodeId = id
        })
      },

      selectNode: (id: string, multiSelect = false) => {
        set((state) => {
          if (multiSelect) {
            if (state.selectedNodeIds.includes(id)) {
              state.selectedNodeIds = state.selectedNodeIds.filter((nodeId) => nodeId !== id)
            } else {
              state.selectedNodeIds.push(id)
            }
          } else {
            state.selectedNodeIds = [id]
          }
        })
      },

      clearSelection: () => {
        set((state) => {
          state.selectedNodeIds = []
        })
      },

      selectAll: () => {
        set((state) => {
          state.selectedNodeIds = state.nodes.map((n) => n.id)
        })
      },

      // Editor Actions
      setIsEditing: (editing: boolean) => {
        set((state) => {
          state.isEditing = editing
        })
      },

      updateEditorSettings: (settings: Partial<EditorSettings>) => {
        set((state) => {
          Object.assign(state.editorSettings, settings)
        })
      },

      toggleSidebar: () => {
        set((state) => {
          state.sidebarCollapsed = !state.sidebarCollapsed
        })
      },

      setActiveView: (view: "editor" | "flow" | "outline") => {
        set((state) => {
          state.activeView = view
        })
      },

      // History Actions
      saveToHistory: () => {
        // This method is handled inline in other actions for better performance
        console.log('💾 History save called - handled inline in operations')
      },

      undo: () => {
        const { history } = get()
        if (history.past.length === 0) return

        set((state) => {
          const previous = state.history.past.pop()!
          state.history.future.unshift([...state.nodes])
          state.nodes = previous
        })
      },

      redo: () => {
        const { history } = get()
        if (history.future.length === 0) return

        set((state) => {
          const next = state.history.future.shift()!
          state.history.past.push([...state.nodes])
          state.nodes = next
        })
      },

      canUndo: () => get().history.past.length > 0,
      canRedo: () => get().history.future.length > 0,

      // Enhanced API Actions - This is where the magic of AI integration happens
      generateBranches: async (nodeId: string, options = {}) => {
        const { regenerate = false, genre = '', tone = 'neutral' } = options
        
        console.log(`🤖 ${regenerate ? 'Regenerating' : 'Generating'} branches for node:`, nodeId)

        // Find and validate the target node
        const node = get().getNodeById(nodeId)
        if (!node) {
          console.error('❌ Node not found:', nodeId)
          set((state) => {
            state.branchGenerationError = 'Scene not found. Please select a valid scene.'
          })
          return
        }

        // Clear previous errors and set appropriate loading state
        set((state) => {
          state.branchGenerationError = null
          state.isGeneratingBranches = !regenerate
          state.isRegeneratingBranches = regenerate
          if (regenerate) {
            state.branchOptions = [] // Clear existing options for regeneration
          }
        })

        try {
          // Extract context and prepare request
          const characterNames = get().extractCharacterNames()
          const currentProject = get().currentProject
          
          const request = {
            context: node.content || node.title, // Use content if available, fallback to title
            current_node_id: nodeId,
            character_names: characterNames,
            genre: genre || currentProject?.genre || '',
            tone: tone,
          }

          console.log('📤 Sending branch request:', request)

          // Call the appropriate API method
          const response = regenerate 
            ? await branchService.regenerateBranches(request)
            : await branchService.generateBranches(request)

          console.log('✅ Branches generated successfully:', response.options.length, 'options')

          // Update state with successful response
          set((state) => {
            state.branchOptions = response.options
            state.lastBranchGenerationTime = response.generation_time
            state.isGeneratingBranches = false
            state.isRegeneratingBranches = false
            
            if (response.cached) {
              console.log('📦 Result was cached (faster response)')
            }
          })

        } catch (error) {
          console.error('❌ Branch generation failed:', error)
          
          const errorMessage = getErrorMessage(error)
          
          set((state) => {
            state.branchGenerationError = errorMessage
            state.isGeneratingBranches = false
            state.isRegeneratingBranches = false
            state.branchOptions = [] // Clear any partial results
          })
        }
      },

      selectBranch: (branch: BranchOption, parentNodeId: string) => {
        console.log('🎯 Selecting branch:', branch.title)

        try {
          const parentNode = get().getNodeById(parentNodeId)
          if (!parentNode) {
            throw new Error('Parent node not found')
          }

          // Calculate position for the new node (offset from parent for visual clarity)
          const newPosition = {
            x: parentNode.position.x + 250 + (Math.random() - 0.5) * 100,
            y: parentNode.position.y + (Math.random() - 0.5) * 200,
          }

          // Create the new node with branch content
          const newNodeId = get().addNode(branch.title, newPosition)

          // Populate with AI-generated content and metadata
          get().updateNodeContent(newNodeId, branch.content)
          get().updateNodeStatus(newNodeId, 'suggestion') // Mark as AI-generated

          // Add character tags for story tracking
          branch.characters.forEach(character => {
            get().addNodeTag(newNodeId, `character:${character}`)
          })

          // Add impact level and thematic tags
          get().addNodeTag(newNodeId, `impact:${branch.impact}`)
          branch.tags.forEach(tag => {
            get().addNodeTag(newNodeId, tag)
          })

          // Create visual connection to show story flow
          get().connectNodes(parentNodeId, newNodeId)

          // Navigate to the new node and clear branch options
          get().setCurrentNode(newNodeId)
          get().clearBranchOptions()

          console.log('✅ Branch adopted successfully')

        } catch (error) {
          console.error('❌ Failed to select branch:', error)
          set((state) => {
            state.branchGenerationError = getErrorMessage(error)
          })
        }
      },

      clearBranchOptions: () => {
        set((state) => {
          state.branchOptions = []
          state.branchGenerationError = null
        })
      },

      analyzeStory: async () => {
        console.log('📊 Starting comprehensive story analysis')

        const { nodes, currentProject } = get()
        
        // Validate we have content to analyze
        if (nodes.length === 0) {
          set((state) => {
            state.analysisError = 'No scenes to analyze. Create some content first.'
          })
          return null
        }

        if (!currentProject) {
          set((state) => {
            state.analysisError = 'No project selected. Please create or select a project.'
          })
          return null
        }

        set((state) => {
          state.isAnalyzingStory = true
          state.analysisError = null
        })

        try {
          const request = {
            nodes: nodes,
            project_info: currentProject,
          }

          const analysis = await analyticsService.analyzeStory(request)
          
          console.log('✅ Story analysis completed successfully')

          set((state) => {
            state.isAnalyzingStory = false
            state.lastAnalysis = analysis
          })

          return analysis

        } catch (error) {
          console.error('❌ Story analysis failed:', error)
          
          set((state) => {
            state.analysisError = getErrorMessage(error)
            state.isAnalyzingStory = false
          })
          
          return null
        }
      },

      getQuickInsights: async () => {
        console.log('⚡ Getting quick story insights')

        const { nodes, currentProject } = get()
        
        if (nodes.length === 0) return null

        try {
          const request = {
            nodes: nodes,
            project_info: currentProject!,
          }

          const insights = await analyticsService.getQuickInsights(request)
          
          set((state) => {
            state.quickInsights = insights
          })
          
          console.log('✅ Quick insights generated')
          return insights

        } catch (error) {
          console.error('❌ Quick insights failed:', error)
          // Don't set error state for quick insights (non-critical feature)
          return null
        }
      },

      checkServiceHealth: async () => {
        console.log('🔍 Checking backend service health')

        set((state) => {
          state.isCheckingHealth = true
          state.connectionError = null
        })

        try {
          const health = await healthService.checkAllServices()
          
          set((state) => {
            state.serviceHealth = {
              ...health,
              lastChecked: new Date(),
            }
            state.isCheckingHealth = false
            state.connectionError = null
          })

          console.log('✅ Health check completed:', health)

        } catch (error) {
          console.error('❌ Health check failed:', error)
          
          set((state) => {
            state.connectionError = getErrorMessage(error)
            state.isCheckingHealth = false
            state.serviceHealth = {
              system: false,
              branches: false,
              analytics: false,
              lastChecked: new Date(),
            }
          })
        }
      },

      clearError: (errorType: 'branch' | 'analysis' | 'connection') => {
        set((state) => {
          switch (errorType) {
            case 'branch':
              state.branchGenerationError = null
              break
            case 'analysis':
              state.analysisError = null
              break
            case 'connection':
              state.connectionError = null
              break
          }
        })
      },

      // Bulk Operations
      deleteSelectedNodes: () => {
        const { selectedNodeIds } = get()
        if (selectedNodeIds.length === 0) return

        set((state) => {
          // Save to history
          state.history.past.push([...state.nodes])
          if (state.history.past.length > 50) {
            state.history.past.shift()
          }
          state.history.future = []

          selectedNodeIds.forEach((id) => {
            // Remove the node
            state.nodes = state.nodes.filter((n) => n.id !== id)

            // Remove connections to this node
            state.nodes.forEach((node) => {
              node.connections = node.connections.filter((connId) => connId !== id)
            })

            // Clear current node if it was deleted
            if (state.currentNodeId === id) {
              state.currentNodeId = null
            }
          })

          state.selectedNodeIds = []
        })
      },

      updateSelectedNodesStatus: (status: StoryNode["status"]) => {
        const { selectedNodeIds } = get()
        if (selectedNodeIds.length === 0) return

        set((state) => {
          selectedNodeIds.forEach((id) => {
            const node = state.nodes.find((n) => n.id === id)
            if (node) {
              node.status = status
              node.updatedAt = new Date()
            }
          })
        })
      },

      moveSelectedNodes: (deltaX: number, deltaY: number) => {
        const { selectedNodeIds } = get()
        if (selectedNodeIds.length === 0) return

        set((state) => {
          selectedNodeIds.forEach((id) => {
            const node = state.nodes.find((n) => n.id === id)
            if (node) {
              node.position.x += deltaX
              node.position.y += deltaY
              node.updatedAt = new Date()
            }
          })
        })
      },

      // Import/Export functionality
      exportProject: () => {
        const { currentProject, nodes } = get()
        return JSON.stringify(
          {
            project: currentProject,
            nodes,
            exportedAt: new Date(),
            version: "1.0",
          },
          null,
          2,
        )
      },

      importProject: (data: string) => {
        try {
          const parsed = JSON.parse(data)
          set((state) => {
            if (parsed.project) {
              state.currentProject = parsed.project
              if (!state.projects.find(p => p.id === parsed.project.id)) {
                state.projects.push(parsed.project)
              }
            }
            if (parsed.nodes) {
              state.nodes = parsed.nodes
            }
            state.currentNodeId = null
            state.selectedNodeIds = []
          })
        } catch (error) {
          console.error("Failed to import project:", error)
        }
      },

      exportNode: (id: string) => {
        const node = get().getNodeById(id)
        if (!node) return ""

        return JSON.stringify(
          {
            node,
            exportedAt: new Date(),
            version: "1.0",
          },
          null,
          2,
        )
      },

      importNode: (data: string, position = { x: 0, y: 0 }) => {
        try {
          const parsed = JSON.parse(data)
          if (!parsed.node) return ""

          const newNode = {
            ...parsed.node,
            id: uuidv4(),
            position,
            connections: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          }

          set((state) => {
            state.nodes.push(newNode)
          })

          return newNode.id
        } catch (error) {
          console.error("Failed to import node:", error)
          return ""
        }
      },

      // Getter functions - computed values that derive from current state
      getCurrentNode: () => {
        const { nodes, currentNodeId } = get()
        return currentNodeId ? nodes.find((n) => n.id === currentNodeId) || null : null
      },

      getNodeById: (id: string) => {
        const { nodes } = get()
        return nodes.find((n) => n.id === id) || null
      },

      getConnectedNodes: (id: string) => {
        const { nodes } = get()
        const node = nodes.find((n) => n.id === id)
        if (!node) return []

        return node.connections.map((connId) => nodes.find((n) => n.id === connId)).filter(Boolean) as StoryNode[]
      },

      getSelectedNodes: () => {
        const { nodes, selectedNodeIds } = get()
        return selectedNodeIds.map((id) => nodes.find((n) => n.id === id)).filter(Boolean) as StoryNode[]
      },

      getProjectStats: () => {
        const { nodes } = get()
        return {
          totalNodes: nodes.length,
          writtenNodes: nodes.filter((n) => n.status === "written").length,
          draftNodes: nodes.filter((n) => n.status === "draft").length,
          suggestionNodes: nodes.filter((n) => n.status === "suggestion").length,
          totalWords: nodes.reduce((acc, node) => acc + node.wordCount, 0),
          totalCharacters: nodes.reduce((acc, node) => acc + node.characterCount, 0),
        }
      },

      searchNodes: (query: string) => {
        const { nodes } = get()
        const lowercaseQuery = query.toLowerCase()
        return nodes.filter(
          (node) =>
            node.title.toLowerCase().includes(lowercaseQuery) ||
            node.content.toLowerCase().includes(lowercaseQuery) ||
            node.notes.toLowerCase().includes(lowercaseQuery) ||
            node.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery)),
        )
      },

      getNodesByTag: (tag: string) => {
        const { nodes } = get()
        return nodes.filter((node) => node.tags.includes(tag))
      },

      getNodesByStatus: (status: StoryNode["status"]) => {
        const { nodes } = get()
        return nodes.filter((node) => node.status === status)
      },

      extractCharacterNames: () => {
        const { nodes } = get()
        const characterSet = new Set<string>()

        // Extract character names from tags
        nodes.forEach(node => {
          node.tags.forEach(tag => {
            if (tag.startsWith('character:')) {
              characterSet.add(tag.replace('character:', ''))
            }
          })
        })

        // You could extend this to extract from content using NLP, but tags are more reliable
        return Array.from(characterSet)
      },
    }))
  )
)

// Safe localStorage operations - handle cases where localStorage isn't available
const safeLocalStorage = {
  setItem: (key: string, value: string) => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(key, value)
      }
    } catch (error) {
      console.warn(`Failed to save to localStorage (${key}):`, error)
    }
  },
  getItem: (key: string) => {
    try {
      if (typeof window !== "undefined") {
        return localStorage.getItem(key)
      }
    } catch (error) {
      console.warn(`Failed to read from localStorage (${key}):`, error)
    }
    return null
  }
}

// Automatic persistence - save important state changes to localStorage
if (typeof window !== "undefined") {
  // Subscribe to node changes and persist them
  useStore.subscribe(
    (state) => state.nodes,
    (nodes) => {
      safeLocalStorage.setItem("storyforge-nodes", JSON.stringify(nodes))
    },
    { fireImmediately: false },
  )

  // Subscribe to project changes
  useStore.subscribe(
    (state) => state.projects,
    (projects) => {
      safeLocalStorage.setItem("storyforge-projects", JSON.stringify(projects))
    },
    { fireImmediately: false },
  )

  // Subscribe to current project changes
  useStore.subscribe(
    (state) => state.currentProject,
    (currentProject) => {
      safeLocalStorage.setItem("storyforge-current-project", JSON.stringify(currentProject))
    },
    { fireImmediately: false },
  )

  // Load initial data from localStorage on startup
  const savedNodes = safeLocalStorage.getItem("storyforge-nodes")
  const savedProjects = safeLocalStorage.getItem("storyforge-projects")
  const savedCurrentProject = safeLocalStorage.getItem("storyforge-current-project")

  if (savedNodes) {
    try {
      const nodes = JSON.parse(savedNodes)
      useStore.setState({ nodes })
      console.log('📚 Loaded nodes from localStorage:', nodes.length)
    } catch (error) {
      console.error("Failed to load saved nodes:", error)
    }
  }

  if (savedProjects) {
    try {
      const projects = JSON.parse(savedProjects)
      useStore.setState({ projects })
      console.log('📂 Loaded projects from localStorage:', projects.length)
    } catch (error) {
      console.error("Failed to load saved projects:", error)
    }
  }

  if (savedCurrentProject) {
    try {
      const currentProject = JSON.parse(savedCurrentProject)
      useStore.setState({ currentProject })
      console.log('🎯 Loaded current project from localStorage:', currentProject?.title)
    } catch (error) {
      console.error("Failed to load saved current project:", error)
    }
  }

  // Auto-check service health when the store initializes
  setTimeout(() => {
    useStore.getState().checkServiceHealth()
  }, 1000)
}