// lib/narrative-intelligence.ts - AI-powered story continuation system
// This creates intelligent story writing that understands narrative flow and dependencies

import { StoryNode } from '@/store/store'
import { StoryBranch, analyzeStoryStructure } from '@/lib/story-graph'
import { branchService, getErrorMessage } from '@/lib/api'

/**
 * Represents the narrative context for a specific scene
 * This is what the AI "knows" when writing content for a particular scene
 */
export interface NarrativeContext {
  currentNodeId: string                    // The scene being written
  predecessorNodes: StoryNode[]            // All scenes that come before this one in narrative order
  branchId: string                         // Which story branch this scene belongs to
  positionInBranch: number                 // Where this scene appears in the branch sequence
  totalScenesInBranch: number             // How many scenes are in this branch
  contextText: string                      // Combined text from all predecessor scenes
  characterNames: string[]                 // Characters established in previous scenes
  establishedElements: {                   // Story elements established in prior scenes
    settings: string[]
    plotPoints: string[]
    relationships: string[]
    conflicts: string[]
  }
}

/**
 * Represents a complete story generated from a narrative branch
 * This is the full linear reading experience of a story path
 */
export interface GeneratedStory {
  branchId: string                         // Which branch this story represents
  title: string                            // Generated title for this story version
  fullText: string                         // Complete story text in reading order
  scenes: {                               // Individual scenes with their context
    nodeId: string
    title: string
    content: string
    contextUsed: string                    // What context was used to generate this scene
  }[]
  wordCount: number
  estimatedReadingTime: number             // In minutes
  storyMetadata: {
    genre: string
    tone: string
    themes: string[]
    characterArcs: string[]
  }
}

/**
 * Core class that manages AI-powered story continuation
 * This is the brain that understands narrative dependencies and writes contextually appropriate content
 */
export class NarrativeIntelligenceEngine {
  
  /**
   * Analyze connection changes and trigger story updates
   * This is called whenever the story structure changes
   */
  async processStoryStructureChange(
    nodes: StoryNode[], 
    changedConnections: { fromId: string; toId: string; action: 'added' | 'removed' }[]
  ): Promise<{
    updatedNodes: StoryNode[]
    generatedStories: GeneratedStory[]
    analysisInsights: string[]
  }> {
    
    console.log('🧠 Processing story structure change...')
    console.log('📊 Analyzing', nodes.length, 'nodes with', changedConnections.length, 'connection changes')
    
    // Step 1: Analyze the new story structure to understand all narrative branches
    const storyStructure = analyzeStoryStructure(nodes)
    console.log(`🌳 Discovered ${storyStructure.totalBranches} narrative branches`)
    
    // Step 2: For each affected branch, update scene content based on narrative flow
    const updatedNodes = [...nodes] // Create a copy to modify
    const generatedStories: GeneratedStory[] = []
    
    // Process each branch separately to maintain narrative isolation
    const allBranches = [storyStructure.mainBranch, ...storyStructure.alternateBranches]
    
    for (const branch of allBranches) {
      if (branch.nodes.length === 0) continue
      
      console.log(`📝 Processing branch: ${branch.title} with ${branch.nodes.length} scenes`)
      
      // Step 3: Update content for scenes affected by connection changes
      const branchUpdatedNodes = await this.updateBranchContent(branch, changedConnections)
      
      // Apply updates to our main nodes array
      branchUpdatedNodes.forEach(updatedNode => {
        const index = updatedNodes.findIndex(n => n.id === updatedNode.id)
        if (index !== -1) {
          updatedNodes[index] = updatedNode
        }
      })
      
      // Step 4: Generate complete story for this branch
      const completeStory = await this.generateCompleteStory(branch, branchUpdatedNodes)
      generatedStories.push(completeStory)
    }
    
    // Step 5: Generate insights about the story structure and changes
    const analysisInsights = this.generateStructureInsights(storyStructure, changedConnections)
    
    return {
      updatedNodes,
      generatedStories,
      analysisInsights
    }
  }
  
  /**
   * Update content for scenes in a specific branch based on narrative dependencies
   * This ensures each scene flows naturally from its predecessors
   */
  private async updateBranchContent(
    branch: StoryBranch, 
    changedConnections: { fromId: string; toId: string; action: 'added' | 'removed' }[]
  ): Promise<StoryNode[]> {
    
    const updatedNodes: StoryNode[] = []
    
    // Process scenes in narrative order (important for dependency chain)
    for (let i = 0; i < branch.nodes.length; i++) {
      const currentNode = branch.nodes[i]
      
      // Check if this scene was affected by connection changes
      const wasAffected = changedConnections.some(change => 
        change.toId === currentNode.id || 
        (i > 0 && change.toId === branch.nodes[i-1].id) // Previous scene was affected
      )
      
      // Skip updating if this scene wasn't affected and already has content
      if (!wasAffected && currentNode.content.trim().length > 0 && currentNode.status === 'written') {
        updatedNodes.push(currentNode)
        continue
      }
      
      console.log(`✍️ Updating content for scene: ${currentNode.title}`)
      
      // Build narrative context for this scene
      const context = this.buildNarrativeContext(currentNode, branch.nodes, i)
      
      // Generate new content using AI
      const updatedContent = await this.generateSceneContent(context)
      
      // Create updated node with new content
      const updatedNode: StoryNode = {
        ...currentNode,
        content: updatedContent,
        status: 'written',
        updatedAt: new Date(),
        wordCount: this.calculateWordCount(updatedContent)
      }
      
      updatedNodes.push(updatedNode)
    }
    
    return updatedNodes
  }
  
  /**
   * Build narrative context for a specific scene
   * This determines what the AI "knows" when writing this scene
   */
  private buildNarrativeContext(
    currentNode: StoryNode, 
    branchNodes: StoryNode[], 
    currentIndex: number
  ): NarrativeContext {
    
    // Get all predecessor scenes in narrative order
    const predecessorNodes = branchNodes.slice(0, currentIndex)
    
    // Combine context text from all predecessor scenes
    const contextText = predecessorNodes
      .map(node => node.content)
      .filter(content => content.trim().length > 0)
      .join('\n\n---\n\n') // Separate scenes with clear dividers
    
    // Extract established story elements from predecessors
    const establishedElements = this.extractStoryElements(predecessorNodes)
    
    // Extract character names from predecessor scenes
    const characterNames = this.extractCharacterNames(predecessorNodes)
    
    return {
      currentNodeId: currentNode.id,
      predecessorNodes,
      branchId: `branch_${branchNodes[0].id}`, // Use first node ID as branch identifier
      positionInBranch: currentIndex + 1,
      totalScenesInBranch: branchNodes.length,
      contextText,
      characterNames,
      establishedElements
    }
  }
  
  /**
   * Generate content for a specific scene using AI
   * This creates content that flows naturally from the narrative context
   */
  private async generateSceneContent(context: NarrativeContext): Promise<string> {
    
    // Build a sophisticated prompt that includes narrative context
    const prompt = this.buildSceneGenerationPrompt(context)
    
    try {
      // Use the existing branch generation API but with enhanced context
      const response = await branchService.generateBranches({
        context: prompt,
        current_node_id: context.currentNodeId,
        character_names: context.characterNames,
        genre: this.inferGenre(context.contextText),
        tone: this.inferTone(context.contextText)
      })
      
      // Select the best option from the generated branches
      // For scene continuation, we want the option with highest narrative coherence
      const bestOption = this.selectBestContinuation(response.options, context)
      
      return bestOption.content
      
    } catch (error) {
      console.error('❌ Failed to generate scene content:', error)
      
      // Fallback: Create basic continuation prompt
      return this.generateFallbackContent(context)
    }
  }
  
  /**
   * Build a sophisticated prompt for scene generation
   * This prompt includes all the narrative context and dependencies
   */
  private buildSceneGenerationPrompt(context: NarrativeContext): string {
    
    let prompt = `Continue this story by writing scene ${context.positionInBranch} of ${context.totalScenesInBranch}.\n\n`
    
    // Include story context if available
    if (context.contextText.length > 0) {
      prompt += `STORY SO FAR:\n${context.contextText}\n\n`
    }
    
    // Include established elements
    if (context.establishedElements.settings.length > 0) {
      prompt += `ESTABLISHED SETTINGS: ${context.establishedElements.settings.join(', ')}\n`
    }
    
    if (context.establishedElements.plotPoints.length > 0) {
      prompt += `PLOT DEVELOPMENTS: ${context.establishedElements.plotPoints.join(', ')}\n`
    }
    
    if (context.characterNames.length > 0) {
      prompt += `CHARACTERS: ${context.characterNames.join(', ')}\n`
    }
    
    prompt += `\nWrite the next scene that follows naturally from what has happened so far. `
    prompt += `The scene should advance the story while maintaining consistency with established elements. `
    prompt += `Write in a style that matches the existing narrative.`
    
    return prompt
  }
  
  /**
   * Generate a complete story from a narrative branch
   * This creates the full reading experience by combining all scenes in order
   */
  private async generateCompleteStory(
    branch: StoryBranch, 
    updatedNodes: StoryNode[]
  ): Promise<GeneratedStory> {
    
    console.log(`📖 Generating complete story for branch: ${branch.title}`)
    
    // Combine all scene content in narrative order
    const scenes = branch.nodes.map(node => {
      const updatedNode = updatedNodes.find(n => n.id === node.id) || node
      return {
        nodeId: node.id,
        title: node.title,
        content: updatedNode.content,
        contextUsed: this.getSceneContext(node, branch.nodes)
      }
    })
    
    // Create full story text with proper formatting
    const fullText = scenes
      .map(scene => `# ${scene.title}\n\n${scene.content}`)
      .join('\n\n---\n\n')
    
    // Calculate metadata
    const wordCount = this.calculateWordCount(fullText)
    const estimatedReadingTime = Math.ceil(wordCount / 200) // Assuming 200 words per minute
    
    // Generate story metadata using AI analysis
    const storyMetadata = await this.analyzeStoryMetadata(fullText)
    
    return {
      branchId: branch.id,
      title: await this.generateStoryTitle(fullText),
      fullText,
      scenes,
      wordCount,
      estimatedReadingTime,
      storyMetadata
    }
  }
  
  /**
   * Extract story elements (settings, plot points, etc.) from scenes
   * This helps maintain consistency across the narrative
   */
  private extractStoryElements(nodes: StoryNode[]): {
    settings: string[]
    plotPoints: string[]
    relationships: string[]
    conflicts: string[]
  } {
    
    const allText = nodes.map(n => n.content).join(' ').toLowerCase()
    
    // Simple keyword-based extraction (could be enhanced with NLP)
    const settings = this.extractByKeywords(allText, [
      'in the', 'at the', 'inside', 'outside', 'location', 'place', 'room', 'building'
    ])
    
    const plotPoints = this.extractByKeywords(allText, [
      'discovered', 'revealed', 'found', 'happened', 'occurred', 'decided'
    ])
    
    const relationships = this.extractByKeywords(allText, [
      'friend', 'enemy', 'partner', 'spouse', 'sibling', 'parent', 'child'
    ])
    
    const conflicts = this.extractByKeywords(allText, [
      'conflict', 'problem', 'issue', 'challenge', 'obstacle', 'fight', 'argument'
    ])
    
    return { settings, plotPoints, relationships, conflicts }
  }
  
  /**
   * Extract character names from story content
   * This identifies characters mentioned in previous scenes
   */
  private extractCharacterNames(nodes: StoryNode[]): string[] {
    const characterSet = new Set<string>()
    
    // Extract from tags first (most reliable)
    nodes.forEach(node => {
      node.tags.forEach(tag => {
        if (tag.startsWith('character:')) {
          characterSet.add(tag.replace('character:', ''))
        }
      })
    })
    
    // Could add content-based character extraction here
    // For now, rely on tags for accuracy
    
    return Array.from(characterSet)
  }
  
  /**
   * Select the best continuation option from AI-generated branches
   * This chooses the option that best fits the narrative context
   */
  private selectBestContinuation(options: any[], context: NarrativeContext): any {
    if (options.length === 0) {
      throw new Error('No continuation options generated')
    }
    
    // Score each option based on narrative coherence
    const scoredOptions = options.map(option => ({
      option,
      score: this.calculateCoherenceScore(option, context)
    }))
    
    // Sort by score and return the best option
    scoredOptions.sort((a, b) => b.score - a.score)
    return scoredOptions[0].option
  }
  
  /**
   * Calculate how well an option fits the narrative context
   * This scoring helps choose the most appropriate continuation
   */
  private calculateCoherenceScore(option: any, context: NarrativeContext): number {
    let score = 0
    
    const optionText = option.content.toLowerCase()
    const contextText = context.contextText.toLowerCase()
    
    // Reward mentions of established characters
    context.characterNames.forEach(character => {
      if (optionText.includes(character.toLowerCase())) {
        score += 10
      }
    })
    
    // Reward consistency with established settings
    context.establishedElements.settings.forEach(setting => {
      if (optionText.includes(setting)) {
        score += 5
      }
    })
    
    // Reward narrative progression keywords
    const progressionKeywords = ['then', 'next', 'after', 'following', 'suddenly', 'meanwhile']
    progressionKeywords.forEach(keyword => {
      if (optionText.includes(keyword)) {
        score += 3
      }
    })
    
    return score
  }
  
  // Helper methods for content analysis and generation
  
  private extractByKeywords(text: string, keywords: string[]): string[] {
    const extracted = new Set<string>()
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`${keyword}\\s+([\\w\\s]{1,30})`, 'gi')
      const matches = text.match(regex)
      if (matches) {
        matches.forEach(match => {
          const cleaned = match.replace(keyword, '').trim()
          if (cleaned.length > 2) {
            extracted.add(cleaned.split(' ').slice(0, 3).join(' '))
          }
        })
      }
    })
    
    return Array.from(extracted).slice(0, 5) // Limit to 5 most relevant
  }
  
  private inferGenre(text: string): string {
    const genreKeywords = {
      mystery: ['detective', 'clue', 'mystery', 'murder', 'investigate'],
      romance: ['love', 'heart', 'relationship', 'romantic', 'kiss'],
      fantasy: ['magic', 'dragon', 'wizard', 'enchanted', 'spell'],
      thriller: ['danger', 'chase', 'escape', 'threat', 'tension'],
      drama: ['emotion', 'family', 'relationship', 'conflict', 'decision']
    }
    
    const textLower = text.toLowerCase()
    const scores = Object.entries(genreKeywords).map(([genre, keywords]) => ({
      genre,
      score: keywords.reduce((sum, keyword) => 
        sum + (textLower.split(keyword).length - 1), 0)
    }))
    
    scores.sort((a, b) => b.score - a.score)
    return scores[0]?.genre || 'general'
  }
  
  private inferTone(text: string): string {
    const toneKeywords = {
      dark: ['dark', 'grim', 'serious', 'ominous', 'foreboding'],
      light: ['cheerful', 'bright', 'happy', 'optimistic', 'joyful'],
      tense: ['tense', 'urgent', 'pressure', 'stress', 'anxiety'],
      mysterious: ['mysterious', 'unknown', 'hidden', 'secret', 'enigmatic']
    }
    
    const textLower = text.toLowerCase()
    const scores = Object.entries(toneKeywords).map(([tone, keywords]) => ({
      tone,
      score: keywords.reduce((sum, keyword) => 
        sum + (textLower.split(keyword).length - 1), 0)
    }))
    
    scores.sort((a, b) => b.score - a.score)
    return scores[0]?.tone || 'neutral'
  }
  
  private calculateWordCount(content: string): number {
    if (!content || content.trim() === '') return 0
    const text = content.replace(/<[^>]*>/g, '').trim()
    if (!text) return 0
    return text.split(/\s+/).filter((word) => word.length > 0).length
  }
  
  private getSceneContext(node: StoryNode, branchNodes: StoryNode[]): string {
    const index = branchNodes.findIndex(n => n.id === node.id)
    const predecessors = branchNodes.slice(0, index)
    return predecessors.map(n => n.title).join(' → ')
  }
  
  private async generateStoryTitle(fullText: string): Promise<string> {
    // Simple title generation based on content analysis
    const words = fullText.split(' ').slice(0, 100).join(' ')
    
    // Extract key themes and characters for title inspiration
    const themes = this.extractByKeywords(words.toLowerCase(), [
      'adventure', 'mystery', 'love', 'quest', 'journey', 'discovery'
    ])
    
    if (themes.length > 0) {
      return `The ${themes[0].charAt(0).toUpperCase() + themes[0].slice(1)}`
    }
    
    return 'Untitled Story'
  }
  
  private async analyzeStoryMetadata(fullText: string): Promise<{
    genre: string
    tone: string
    themes: string[]
    characterArcs: string[]
  }> {
    
    return {
      genre: this.inferGenre(fullText),
      tone: this.inferTone(fullText),
      themes: this.extractByKeywords(fullText.toLowerCase(), [
        'love', 'betrayal', 'redemption', 'discovery', 'growth', 'conflict'
      ]),
      characterArcs: [] // Could be enhanced with character analysis
    }
  }
  
  private generateFallbackContent(context: NarrativeContext): string {
    if (context.positionInBranch === 1) {
      return "The story begins here. This opening scene sets the stage for what follows."
    }
    
    return `Continuing from the previous scene, the story develops further. This is scene ${context.positionInBranch} of ${context.totalScenesInBranch}.`
  }
  
  private generateStructureInsights(
    storyStructure: any, 
    changes: { fromId: string; toId: string; action: 'added' | 'removed' }[]
  ): string[] {
    const insights = []
    
    const addedConnections = changes.filter(c => c.action === 'added').length
    const removedConnections = changes.filter(c => c.action === 'removed').length
    
    if (addedConnections > 0) {
      insights.push(`✨ Added ${addedConnections} new story connection(s), enhancing narrative flow`)
    }
    
    if (removedConnections > 0) {
      insights.push(`🔄 Removed ${removedConnections} connection(s), simplifying story structure`)
    }
    
    if (storyStructure.totalBranches > 1) {
      insights.push(`🌳 Your story now has ${storyStructure.totalBranches} distinct narrative paths`)
    }
    
    if (storyStructure.orphanedNodes.length > 0) {
      insights.push(`💡 ${storyStructure.orphanedNodes.length} scenes are not yet connected to the main story flow`)
    }
    
    return insights
  }
}

// Global instance for use throughout the application
export const narrativeEngine = new NarrativeIntelligenceEngine()