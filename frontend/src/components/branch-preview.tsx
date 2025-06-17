"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Users, Tag, Sparkles, ChevronRight, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"

interface BranchOption {
  id: string
  title: string
  summary: string
  content: string
  characters: string[]
  impact: string
  tags: string[]
}

interface BranchPreviewProps {
  options: BranchOption[]
  onSelect: (option: BranchOption) => void
  onClose: () => void
}

export function BranchPreview({ options, onSelect, onClose }: BranchPreviewProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case "high": return "destructive"
      case "medium": return "default"
      case "low": return "secondary"
      default: return "secondary"
    }
  }

  const handleOptionSelect = (option: BranchOption) => {
    setSelectedOptionId(option.id)
    setTimeout(() => onSelect(option), 150)
  }

  return (
    <div className="fixed right-0 top-16 bottom-0 w-80 lg:w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-xl z-30 flex flex-col">
      
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 ${isCollapsed ? 'border-b-0' : ''}`}>
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-indigo-500 rounded-md flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">AI Branches</h3>
            {!isCollapsed && (
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {options.length} story options
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-7 w-7 p-0"
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="h-7 w-7 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-3">
            {options.map((option, index) => (
              <Card
                key={option.id}
                className={`cursor-pointer transition-all duration-200 border
                  ${selectedOptionId === option.id 
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 scale-[1.02]" 
                    : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md"
                  }`}
                onClick={() => handleOptionSelect(option)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-bold text-gray-900 dark:text-white leading-tight flex-1">
                      {option.title}
                    </CardTitle>
                    <div className="flex items-center space-x-1 shrink-0">
                      <Badge
                        variant={getImpactColor(option.impact)}
                        className="text-xs"
                      >
                        {option.impact}
                      </Badge>
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    {option.summary}
                  </p>
                </CardHeader>

                <CardContent className="pt-0 space-y-3">
                  {/* Preview Content */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 border-l-2 border-indigo-200 dark:border-indigo-700">
                    <p className="text-xs text-gray-700 dark:text-gray-300 italic leading-relaxed">
                      "{option.content.substring(0, 80)}
                      {option.content.length > 80 ? "..." : ""}"
                    </p>
                  </div>

                  {/* Metadata - Compact */}
                  <div className="space-y-2">
                    {/* Characters */}
                    {option.characters.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3 text-indigo-400 shrink-0" />
                        <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                          {option.characters.slice(0, 2).map((character) => (
                            <span 
                              key={character} 
                              className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-full"
                            >
                              {character}
                            </span>
                          ))}
                          {option.characters.length > 2 && (
                            <span className="text-xs text-gray-500">+{option.characters.length - 2}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {option.tags.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <Tag className="w-3 h-3 text-purple-400 shrink-0" />
                        <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                          {option.tags.slice(0, 3).map((tag) => (
                            <Badge 
                              key={tag} 
                              variant="outline" 
                              className="text-xs h-4 px-1 border-purple-200 dark:border-purple-700 text-purple-600 dark:text-purple-400"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {option.tags.length > 3 && (
                            <span className="text-xs text-gray-500">+{option.tags.length - 3}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <Button 
                    className={`w-full h-7 text-xs transition-all duration-200 ${
                      selectedOptionId === option.id
                        ? "bg-indigo-600 hover:bg-indigo-700" 
                        : "bg-indigo-500 hover:bg-indigo-600"
                    }`}
                    size="sm"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    {selectedOptionId === option.id ? "Selecting..." : "Choose Path"}
                  </Button>
                </CardContent>
              </Card>
            ))}

            {options.length === 0 && (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600">
                  <Sparkles className="w-full h-full" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  No branches yet
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Generate story branches to see options
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer - only when expanded */}
      {!isCollapsed && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800">
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              💡 Compare with your story
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onClose}
              className="h-7 text-xs"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}