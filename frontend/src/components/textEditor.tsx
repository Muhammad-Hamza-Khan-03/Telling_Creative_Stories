"use client"

import { useState, useEffect } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import CharacterCount from "@tiptap/extension-character-count"
import { useStore } from "@/store/store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bold, Italic, Wand2, Maximize2, Minimize2, X } from "lucide-react"

interface TextEditorProps {
  onGenerateBranches: () => void
  isGenerating: boolean
  isMobile?: boolean
}

export function TextEditor({ onGenerateBranches, isGenerating, isMobile = false }: TextEditorProps) {
  const { getCurrentNode, updateNodeContent, currentNodeId, setCurrentNode, setIsEditing, isEditing } = useStore()

  const currentNode = getCurrentNode()
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

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
    onUpdate: ({ editor }) => {
      const content = editor.getHTML()
      if (currentNodeId && content !== currentNode?.content) {
        setIsSaving(true)
        const timeoutId = setTimeout(() => {
          updateNodeContent(currentNodeId, content)
          setIsSaving(false)
          setLastSaved(new Date())
        }, 1000)

        return () => clearTimeout(timeoutId)
      }
    },
    onFocus: () => setIsEditing(true),
    onBlur: () => setIsEditing(false),
  })

  // Update editor content when current node changes
  useEffect(() => {
    if (editor && currentNode) {
      const newContent = currentNode.content || ""
      if (editor.getHTML() !== newContent) {
        editor.commands.setContent(newContent)
        setLastSaved(null)
      }
    }
  }, [currentNode, editor]) // Updated dependency array to use currentNode directly

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading editor...</div>
      </div>
    )
  }

  if (!currentNode) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-50 ${isMobile ? "p-4" : ""}`}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-gray-500 text-lg mb-2">No scene selected</p>
          <p className="text-gray-400 text-sm">Click a scene on the map to start writing</p>
        </div>
      </div>
    )
  }

  const editorContent = (
    <div className={`flex flex-col h-full ${isFullscreen ? "fixed inset-0 z-50 bg-white" : ""}`}>
      {/* Editor Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-3">
          <h2 className="font-semibold text-gray-800 truncate">{currentNode.title}</h2>
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
          <div className="text-xs text-gray-500">
            {isSaving ? (
              <div className="flex items-center text-yellow-600">
                <div className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse mr-1"></div>
                Saving...
              </div>
            ) : lastSaved ? (
              <span className="text-green-600">Saved</span>
            ) : editor.getHTML() !== currentNode.content ? (
              <span className="text-orange-600">Unsaved</span>
            ) : (
              <span className="text-gray-400">Synced</span>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b bg-white">
        <div className="flex items-center space-x-1">
          <Button
            variant={editor.isActive("bold") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            variant={editor.isActive("italic") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
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

        <Button
          onClick={onGenerateBranches}
          disabled={isGenerating}
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Wand2 className={`w-4 h-4 mr-2 ${isGenerating ? "animate-spin" : ""}`} />
          {isGenerating ? "Generating..." : "Generate Branches"}
        </Button>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-auto">
        <EditorContent editor={editor} className="h-full prose prose-lg max-w-none p-6 focus:outline-none" />
      </div>

      {/* Editor Footer */}
      <div className="p-3 border-t bg-gray-50 text-xs text-gray-500">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            <span>{editor.storage.characterCount.words()} words</span>
            <span>{editor.storage.characterCount.characters()} characters</span>
          </div>
          <div className="flex space-x-4">
            <span>Scene: {currentNode.id.slice(0, 8)}...</span>
            <span>Updated: {new Date(currentNode.updatedAt).toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  )

  return isFullscreen ? editorContent : <div className="h-full">{editorContent}</div>
}
