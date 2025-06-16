"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Users, Tag } from "lucide-react"

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
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl z-40 max-h-80 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div>
          <h3 className="font-semibold text-gray-900">Story Branch Options</h3>
          <p className="text-sm text-gray-600">Choose how your story continues...</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Branch Options */}
      <div className="p-4 overflow-y-auto max-h-64">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {options.map((option) => (
            <Card
              key={option.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-indigo-300"
              onClick={() => onSelect(option)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base font-semibold text-gray-900 leading-tight">{option.title}</CardTitle>
                  <Badge
                    variant={
                      option.impact === "High" ? "destructive" : option.impact === "Medium" ? "default" : "secondary"
                    }
                    className="text-xs"
                  >
                    {option.impact}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{option.summary}</p>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Preview Content */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700 line-clamp-3 italic">"{option.content.substring(0, 120)}..."</p>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-2">
                    {option.characters.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <Users className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-600">{option.characters.join(", ")}</span>
                      </div>
                    )}

                    {option.tags.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <Tag className="w-3 h-3 text-gray-400" />
                        <div className="flex space-x-1">
                          {option.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Button className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700" size="sm">
                  Choose This Path
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
