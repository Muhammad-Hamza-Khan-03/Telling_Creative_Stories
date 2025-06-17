"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Users, Tag, Sparkles, ChevronRight } from "lucide-react"
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

  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "secondary"
    }
  }

  const handleOptionSelect = (option: BranchOption) => {
    setSelectedOptionId(option.id)
    // Add a slight delay for visual feedback
    setTimeout(() => {
      onSelect(option)
    }, 150)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-end lg:items-center justify-center p-4">
      {/* Main Container - Full screen on mobile, modal on desktop */}
      <div className="w-full max-w-7xl bg-white dark:bg-gray-900 rounded-t-xl lg:rounded-xl shadow-2xl 
                      max-h-[90vh] overflow-hidden flex flex-col
                      animate-in slide-in-from-bottom-8 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700 
                        bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-xl text-gray-900 dark:text-white">Story Branch Options</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose how your story continues... ({options.length} options)
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="shrink-0 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Branch Options Container */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {/* Mobile: Stack layout, Desktop: Responsive grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {options.map((option, index) => (
              <Card
                key={option.id}
                className={`cursor-pointer transition-all duration-200 group
                  hover:shadow-xl hover:scale-[1.02] border-2
                  ${selectedOptionId === option.id 
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 scale-[1.02]" 
                    : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600"
                  }
                  animate-in fade-in slide-in-from-bottom-4 duration-300`}
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => handleOptionSelect(option)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base lg:text-lg font-bold text-gray-900 dark:text-white 
                                        leading-tight flex-1 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                      {option.title}
                    </CardTitle>
                    <div className="flex items-center space-x-2 shrink-0">
                      <Badge
                        variant={getImpactColor(option.impact)}
                        className="text-xs font-medium"
                      >
                        {option.impact} Impact
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 
                                             transition-colors transform group-hover:translate-x-1" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                    {option.summary}
                  </p>
                </CardHeader>

                <CardContent className="pt-0 space-y-4">
                  {/* Preview Content */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 lg:p-4 border-l-4 border-indigo-200 dark:border-indigo-700">
                    <p className="text-sm text-gray-700 dark:text-gray-300 italic leading-relaxed">
                      "{option.content.substring(0, 140)}
                      {option.content.length > 140 ? "..." : ""}"
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-3">
                    {/* Characters */}
                    {option.characters.length > 0 && (
                      <div className="flex items-start space-x-2">
                        <Users className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
                            Characters
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {option.characters.map((character) => (
                              <span 
                                key={character} 
                                className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 
                                         px-2 py-1 rounded-full"
                              >
                                {character}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {option.tags.length > 0 && (
                      <div className="flex items-start space-x-2">
                        <Tag className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
                            Story Elements
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {option.tags.map((tag) => (
                              <Badge 
                                key={tag} 
                                variant="outline" 
                                className="text-xs border-purple-200 dark:border-purple-700 
                                         text-purple-600 dark:text-purple-400"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <Button 
                    className={`w-full mt-4 transition-all duration-200 ${
                      selectedOptionId === option.id
                        ? "bg-indigo-600 hover:bg-indigo-700 scale-105" 
                        : "bg-indigo-500 hover:bg-indigo-600"
                    } text-white font-medium`}
                    size="sm"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {selectedOptionId === option.id ? "Selecting..." : "Choose This Path"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty state fallback */}
          {options.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600">
                <Sparkles className="w-full h-full" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No branches generated
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Try generating some story branches first.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 lg:p-6 
                        bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            💡 Tip: Each choice leads to different story possibilities
          </div>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="dark:border-gray-600 dark:text-gray-300"
          >
            Close Options
          </Button>
        </div>
      </div>
    </div>
  )
}