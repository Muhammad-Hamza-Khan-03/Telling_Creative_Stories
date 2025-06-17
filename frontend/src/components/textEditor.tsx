"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import CharacterCount from "@tiptap/extension-character-count"
import { useStore } from "@/store/store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bold, Italic, Wand2, Maximize2, Minimize2, X, Moon, Sun } from "lucide-react"

interface TextEditorProps {
  onGenerateBranches: () => void
  isGenerating: boolean
  isMobile?: boolean
}

// Custom hook for debounced autosave
function useDebounce<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function TextEditor({ onGenerateBranches, isGenerating, isMobile = false }: TextEditorProps) {
  const { 
    getCurrentNode, 
    updateNodeContent, 
    currentNodeId, 
    setCurrentNode, 
    setIsEditing, 
    isEditing 
  } = useStore()

  const currentNode = getCurrentNode()
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  
  // Content state for debouncing
  const [editorContent, setEditorContent] = useState("")
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedContentRef = useRef("")

  // Debounced content for auto-saving (saves after 2 seconds of no typing)
  const debouncedContent = useDebounce(editorContent, 2000)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "What happens in this scene? Let your imagination flow...",
      }),
      CharacterCount.configure({
        limit: 50000,
      }),
    ],
    content: currentNode?.content || "",
    
    // Handle content changes with proper debouncing
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML()
      setEditorContent(newContent)
      
      // Show saving indicator immediately when typing
      if (newContent !== lastSavedContentRef.current) {
        setIsSaving(true)
      }
    },
    
    onFocus: () => setIsEditing(true),
    onBlur: () => setIsEditing(false),
  })

  

  // Load saved theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('storyforge-theme')
    if (savedTheme) {
      const isDark = savedTheme === 'dark'
      setIsDarkMode(isDark)
      if (isDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [])

  // Update editor content when current node changes
  useEffect(() => {
    if (editor && currentNode) {
      const newContent = currentNode.content || ""
      if (editor.getHTML() !== newContent) {
        editor.commands.setContent(newContent)
        setEditorContent(newContent)
        lastSavedContentRef.current = newContent
        setLastSaved(currentNode.updatedAt ? new Date(currentNode.updatedAt) : null)
        setIsSaving(false)
      }
    }
  }, [currentNode, editor])

  // Handle debounced autosave
  useEffect(() => {
    if (debouncedContent && 
        currentNodeId && 
        debouncedContent !== lastSavedContentRef.current) {
      
      // Perform the actual save
      updateNodeContent(currentNodeId, debouncedContent)
      lastSavedContentRef.current = debouncedContent
      setLastSaved(new Date())
      setIsSaving(false)
    }
  }, [debouncedContent, currentNodeId, updateNodeContent])

  // Manual save function for immediate saves
  const handleManualSave = useCallback(() => {
    if (editor && currentNodeId && editorContent !== lastSavedContentRef.current) {
      updateNodeContent(currentNodeId, editorContent)
      lastSavedContentRef.current = editorContent
      setLastSaved(new Date())
      setIsSaving(false)
    }
  }, [editor, currentNodeId, editorContent, updateNodeContent])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleManualSave()
      }
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleManualSave, isFullscreen])

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64 dark:bg-gray-900">
        <div className="text-gray-500 dark:text-gray-400">Loading editor...</div>
      </div>
    )
  }

  if (!currentNode) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900 ${isMobile ? "p-4" : ""}`}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">No scene selected</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm">Click a scene on the map to start writing</p>
        </div>
      </div>
    )
  }

  const getSaveStatus = () => {
    if (isSaving) {
      return (
        <div className="flex items-center text-yellow-600 dark:text-yellow-400">
          <div className="w-2 h-2 bg-yellow-600 dark:bg-yellow-400 rounded-full animate-pulse mr-1"></div>
          Saving...
        </div>
      )
    }
    
    if (lastSaved) {
      const timeDiff = Date.now() - lastSaved.getTime()
      if (timeDiff < 5000) { // Less than 5 seconds ago
        return <span className="text-green-600 dark:text-green-400">Saved</span>
      }
    }
    
    if (editorContent !== lastSavedContentRef.current) {
      return <span className="text-orange-600 dark:text-orange-400">Unsaved changes</span>
    }
    
    return <span className="text-gray-400 dark:text-gray-500">Synced</span>
  }

  const editorContentElement = (
    <div className={`flex flex-col h-full ${isFullscreen ? "fixed inset-0 z-50 bg-white dark:bg-gray-900" : ""}`}>
      {/* Editor Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <h2 className="font-semibold text-gray-800 dark:text-gray-200 truncate">{currentNode.title}</h2>
          <Badge variant={currentNode.status === "written" ? "default" : "secondary"} className="text-xs">
            {currentNode.status}
          </Badge>
        </div>

        <div className="flex items-center space-x-2">
        

          {/* Mobile Close Button */}
          {isMobile && (
            <Button variant="ghost" size="sm" onClick={() => setCurrentNode(null)}>
              <X className="w-4 h-4" />
            </Button>
          )}

          {/* Fullscreen Toggle */}
          {!isMobile && (
            <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          )}

          {/* Save Status */}
          <div className="text-xs">
            {getSaveStatus()}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b bg-white dark:bg-gray-900 dark:border-gray-700">
        <div className="flex items-center space-x-1">
          <Button
            variant={editor.isActive("bold") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            variant={editor.isActive("italic") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().insertContent("<hr>").run()}
            title="Scene Break"
          >
            ---
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().insertContent('<p>"</p>').run()}
            title="Dialogue"
          >
            "
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualSave}
            disabled={editorContent === lastSavedContentRef.current}
            title="Save now (Ctrl+S)"
            className="text-xs"
          >
            Save
          </Button>
          
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-auto bg-white dark:bg-gray-900">
        <EditorContent 
          editor={editor} 
          className="h-full prose prose-lg max-w-none p-6 focus:outline-none dark:prose-invert dark:text-white dark:bg-gray-900" 
        />
      </div>

      {/* Editor Footer */}
      <div className="p-3 border-t bg-gray-50 dark:bg-gray-800 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            <span>{editor.storage.characterCount.words()} words</span>
            <span>{editor.storage.characterCount.characters()} characters</span>
          </div>
          <div className="flex space-x-4">
            <span>Scene: {currentNode.id.slice(0, 8)}...</span>
            <span>Updated: {new Date(currentNode.updatedAt).toLocaleTimeString()}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">Ctrl+S to save</span>
          </div>
        </div>
      </div>
    </div>
  )

  return isFullscreen ? editorContentElement : <div className="h-full">{editorContentElement}</div>
}