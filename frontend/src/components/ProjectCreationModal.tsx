// Updated ProjectCreationModal component with proper focus management
import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { X } from "lucide-react"

interface ProjectCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateProject: (title: string, description: string) => void
}

export function ProjectCreationModal({ 
  isOpen, 
  onClose, 
  onCreateProject 
}: ProjectCreationModalProps) {
  // Local state to prevent parent re-renders from affecting input focus
  const [localTitle, setLocalTitle] = useState("")
  const [localDescription, setLocalDescription] = useState("")
  const titleInputRef = useRef<HTMLInputElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)

  // Auto-focus title input when modal opens
  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      titleInputRef.current.focus()
    }
  }, [isOpen])

  // Memoized handlers to prevent unnecessary re-renders
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalTitle(e.target.value)
  }, [])

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalDescription(e.target.value)
  }, [])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!localTitle.trim()) return
    
    onCreateProject(localTitle, localDescription)
    
    // Reset local state
    setLocalTitle("")
    setLocalDescription("")
    onClose()
  }, [localTitle, localDescription, onCreateProject, onClose])

  const handleClose = useCallback(() => {
    setLocalTitle("")
    setLocalDescription("")
    onClose()
  }, [onClose])

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose()
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit(e)
    }
  }, [handleClose, handleSubmit])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create New Project
          </h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Project Title*
            </label>
            <Input
              ref={titleInputRef}
              value={localTitle}
              onChange={handleTitleChange}
              placeholder="My Amazing Story"
              className="w-full dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description (optional)
            </label>
            <Textarea
              ref={descriptionRef}
              value={localDescription}
              onChange={handleDescriptionChange}
              placeholder="A brief description of your story..."
              className="w-full dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              rows={3}
            />
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Tip: Press Ctrl+Enter to create quickly
          </div>
          
          <div className="flex justify-end space-x-3 pt-2">
            <Button 
              type="button"
              variant="outline" 
              onClick={handleClose}
              className="dark:border-gray-600 dark:text-gray-300"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={!localTitle.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              Create Project
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}