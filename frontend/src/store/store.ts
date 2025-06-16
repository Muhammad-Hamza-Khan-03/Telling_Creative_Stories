import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { subscribeWithSelector } from "zustand/middleware"
import { v4 as uuidv4 } from "uuid"

// Types and Interfaces
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

export interface StoryState {
  // Project data
  currentProject: StoryProject | null
  projects: StoryProject[]

  // Story data
  nodes: StoryNode[]
  currentNodeId: string | null
  selectedNodeIds: string[]

  // Editor state
  isEditing: boolean
  editorSettings: EditorSettings

  // UI state
  sidebarCollapsed: boolean
  activeView: "editor" | "flow" | "outline"

  // History for undo/redo
  history: {
    past: StoryNode[][]
    present: StoryNode[]
    future: StoryNode[][]
  }

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

  // Getters
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
}

// Default settings
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

// Helper functions
const calculateWordCount = (content: string): number => {
  if (!content || content.trim() === '') return 0
  // Remove HTML tags and count words
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

export const useStore = create<StoryState>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // Initial state
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

      // Project Management Actions
      createProject: (title: string, description = "") => {
        console.log('Creating project:', title)
        const project = createNewProject(title, description)
        set((state) => {
          state.projects.push(project)
          state.currentProject = project
          console.log('Project created:', project)
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
          // Don't clear nodes here - they should persist per project
        })
      },

      // Node Management Actions
      addNode: (title: string, position = { x: 0, y: 0 }) => {
        console.log('Adding node:', title, position)
        
        // Ensure we have a current project
        if (!get().currentProject) {
          console.warn('No current project, creating default project')
          get().createProject('My Story')
        }

        const node = createNewNode(title, position)
        console.log('Created node:', node)
        
        set((state) => {
          // Save current state to history
          if (state.nodes.length > 0) {
            state.history.past.push([...state.nodes])
            if (state.history.past.length > 50) {
              state.history.past.shift()
            }
            state.history.future = []
          }
          
          // Add the new node
          state.nodes.push(node)
          console.log('Node added to state, total nodes:', state.nodes.length)
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
        console.log('Connecting nodes:', fromId, 'to', toId)
        set((state) => {
          // Save to history
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
        console.log('Setting current node:', id)
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
        // This method is now handled inline in other actions
        console.log('saveToHistory called - handled inline')
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

      // Import/Export
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

      // Getters
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
    })),
  ),
)

// Safe localStorage operations
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

// Subscribe to changes for auto-save to localStorage (optional)
if (typeof window !== "undefined") {
  useStore.subscribe(
    (state) => state.nodes,
    (nodes) => {
      safeLocalStorage.setItem("storyforge-nodes", JSON.stringify(nodes))
    },
    { fireImmediately: false },
  )

  useStore.subscribe(
    (state) => state.projects,
    (projects) => {
      safeLocalStorage.setItem("storyforge-projects", JSON.stringify(projects))
    },
    { fireImmediately: false },
  )

  useStore.subscribe(
    (state) => state.currentProject,
    (currentProject) => {
      safeLocalStorage.setItem("storyforge-current-project", JSON.stringify(currentProject))
    },
    { fireImmediately: false },
  )

  // Load initial data from localStorage
  const savedNodes = safeLocalStorage.getItem("storyforge-nodes")
  const savedProjects = safeLocalStorage.getItem("storyforge-projects")
  const savedCurrentProject = safeLocalStorage.getItem("storyforge-current-project")

  if (savedNodes) {
    try {
      const nodes = JSON.parse(savedNodes)
      useStore.setState({ nodes })
      console.log('Loaded nodes from localStorage:', nodes.length)
    } catch (error) {
      console.error("Failed to load saved nodes:", error)
    }
  }

  if (savedProjects) {
    try {
      const projects = JSON.parse(savedProjects)
      useStore.setState({ projects })
      console.log('Loaded projects from localStorage:', projects.length)
    } catch (error) {
      console.error("Failed to load saved projects:", error)
    }
  }

  if (savedCurrentProject) {
    try {
      const currentProject = JSON.parse(savedCurrentProject)
      useStore.setState({ currentProject })
      console.log('Loaded current project from localStorage:', currentProject?.title)
    } catch (error) {
      console.error("Failed to load saved current project:", error)
    }
  }
}