// lib/story-graph.ts - Graph traversal utilities for story branch analysis

import { StoryNode } from '@/store/store'

/**
 * Represents a complete story branch - a linear path through connected nodes
 * This is the fundamental unit for story analysis and export
 */
export interface StoryBranch {
  id: string                    // Unique identifier for this branch
  title: string                 // Human-readable title for the branch
  nodes: StoryNode[]           // Ordered array of nodes in narrative sequence
  wordCount: number            // Total words in this branch
  characterCount: number       // Total characters in this branch
  isComplete: boolean          // Whether this branch has a clear ending
  branchingPoint?: string      // ID of the node where this branch splits from parent
  parentBranchId?: string      // ID of parent branch if this is a sub-branch
}

/**
 * Represents the complete story structure with all possible narrative paths
 * Think of this as a family tree of story possibilities
 */
export interface StoryStructure {
  mainBranch: StoryBranch      // The primary narrative path
  alternateBranches: StoryBranch[]  // All alternative story paths
  orphanedNodes: StoryNode[]   // Nodes not connected to any branch
  totalBranches: number        // Count of all possible story paths
  isLinear: boolean           // True if story has no branching (single path)
}

/**
 * Find all root nodes - these are potential story starting points
 * A root node is one that has no incoming connections (no other nodes point to it)
 * 
 * Think of this like finding the opening chapters of books in a library
 */
export function findRootNodes(nodes: StoryNode[]): StoryNode[] {
  // Create a set of all node IDs that are targets of connections
  const targetNodeIds = new Set<string>()
  
  // Scan through all nodes and collect IDs that are pointed to by others
  nodes.forEach(node => {
    node.connections.forEach(targetId => {
      targetNodeIds.add(targetId)
    })
  })
  
  // Root nodes are those that appear in our nodes list but are never targets
  const rootNodes = nodes.filter(node => !targetNodeIds.has(node.id))
  
  console.log(`📚 Found ${rootNodes.length} root nodes (story starting points)`)
  return rootNodes
}

/**
 * Find all leaf nodes - these are potential story ending points
 * A leaf node is one that has no outgoing connections (doesn't point to other nodes)
 */
export function findLeafNodes(nodes: StoryNode[]): StoryNode[] {
  const leafNodes = nodes.filter(node => node.connections.length === 0)
  console.log(`🏁 Found ${leafNodes.length} leaf nodes (potential endings)`)
  return leafNodes
}

/**
 * Traverse from a starting node to build a complete story branch
 * This follows the connections like following a trail through the forest
 * 
 * @param startNode - The node to begin traversal from
 * @param allNodes - Complete array of available nodes for lookup
 * @param visitedNodes - Set of node IDs we've already processed (prevents infinite loops)
 * @returns Array of all possible branches starting from this node
 */
export function traverseBranchFromNode(
  startNode: StoryNode, 
  allNodes: StoryNode[], 
  visitedNodes: Set<string> = new Set()
): StoryBranch[] {
  
  const branches: StoryBranch[] = []
  
  // Create a lookup map for efficient node retrieval by ID
  const nodeMap = new Map(allNodes.map(node => [node.id, node]))
  
  /**
   * Recursive function to build a single path through the story graph
   * This is where the magic happens - we follow connections to build narrative sequences
   */
  function buildPath(
    currentNode: StoryNode, 
    currentPath: StoryNode[], 
    visited: Set<string>
  ): void {
    
    // Prevent infinite loops by checking if we've been here before
    if (visited.has(currentNode.id)) {
      console.warn(`🔄 Detected cycle at node ${currentNode.id}, stopping traversal`)
      return
    }
    
    // Add current node to our path and mark it as visited
    const newPath = [...currentPath, currentNode]
    const newVisited = new Set([...visited, currentNode.id])
    
    // If this node has no connections, we've reached the end of a branch
    if (currentNode.connections.length === 0) {
      branches.push(createBranchFromPath(newPath))
      return
    }
    
    // If this node connects to multiple nodes, we have branching narrative paths
    // Each connection becomes a separate branch possibility
    currentNode.connections.forEach(connectionId => {
      const nextNode = nodeMap.get(connectionId)
      
      if (nextNode) {
        buildPath(nextNode, newPath, newVisited)
      } else {
        console.warn(`⚠️ Connection points to missing node: ${connectionId}`)
        // Create a branch ending at the current node since next node is missing
        branches.push(createBranchFromPath(newPath))
      }
    })
  }
  
  // Start the recursive traversal from our starting node
  buildPath(startNode, [], visitedNodes)
  
  console.log(`🌿 Traversed from ${startNode.title}, found ${branches.length} branches`)
  return branches
}

/**
 * Convert an ordered array of nodes into a structured StoryBranch object
 * This transforms raw graph data into a meaningful narrative unit
 */
function createBranchFromPath(nodePath: StoryNode[]): StoryBranch {
  if (nodePath.length === 0) {
    throw new Error('Cannot create branch from empty path')
  }
  
  // Calculate aggregate statistics for this branch
  const totalWords = nodePath.reduce((sum, node) => sum + (node.wordCount || 0), 0)
  const totalChars = nodePath.reduce((sum, node) => sum + (node.characterCount || 0), 0)
  
  // Generate a meaningful title for this branch
  const branchTitle = nodePath.length === 1 
    ? nodePath[0].title 
    : `${nodePath[0].title} → ${nodePath[nodePath.length - 1].title}`
  
  // Determine if this is a complete narrative (has substantial content)
  const isComplete = totalWords > 100 && nodePath[nodePath.length - 1].status !== 'draft'
  
  return {
    id: `branch_${nodePath.map(n => n.id.slice(0, 4)).join('_')}`,
    title: branchTitle,
    nodes: nodePath,
    wordCount: totalWords,
    characterCount: totalChars,
    isComplete,
  }
}

/**
 * Analyze the complete story structure to understand all narrative possibilities
 * This is the main function that orchestrates the entire graph analysis
 */
export function analyzeStoryStructure(nodes: StoryNode[]): StoryStructure {
  console.log(`🔍 Analyzing story structure with ${nodes.length} nodes`)
  
  if (nodes.length === 0) {
    return {
      mainBranch: createEmptyBranch(),
      alternateBranches: [],
      orphanedNodes: [],
      totalBranches: 0,
      isLinear: true
    }
  }
  
  // Step 1: Find all possible starting points for stories
  const rootNodes = findRootNodes(nodes)
  const allBranches: StoryBranch[] = []
  
  // Step 2: From each root, discover all possible narrative paths
  rootNodes.forEach(rootNode => {
    const branchesFromRoot = traverseBranchFromNode(rootNode, nodes)
    allBranches.push(...branchesFromRoot)
  })
  
  // Step 3: Identify nodes that aren't part of any connected narrative
  const nodesInBranches = new Set<string>()
  allBranches.forEach(branch => {
    branch.nodes.forEach(node => nodesInBranches.add(node.id))
  })
  
  const orphanedNodes = nodes.filter(node => !nodesInBranches.has(node.id))
  
  // Step 4: Determine the main branch (usually the longest or most complete)
  const mainBranch = findMainBranch(allBranches)
  const alternateBranches = allBranches.filter(branch => branch.id !== mainBranch.id)
  
  // Step 5: Analyze overall story structure characteristics
  const isLinear = allBranches.length <= 1 && orphanedNodes.length === 0
  
  console.log(`📊 Analysis complete: ${allBranches.length} branches, ${orphanedNodes.length} orphaned nodes`)
  
  return {
    mainBranch,
    alternateBranches,
    orphanedNodes,
    totalBranches: allBranches.length,
    isLinear
  }
}

/**
 * Determine which branch should be considered the "main" story path
 * Uses heuristics like word count, completeness, and node count
 */
function findMainBranch(branches: StoryBranch[]): StoryBranch {
  if (branches.length === 0) {
    return createEmptyBranch()
  }
  
  if (branches.length === 1) {
    return branches[0]
  }
  
  // Score each branch based on multiple factors
  const scoredBranches = branches.map(branch => ({
    branch,
    score: calculateBranchScore(branch)
  }))
  
  // Sort by score and return the highest scoring branch
  scoredBranches.sort((a, b) => b.score - a.score)
  
  console.log(`🎯 Selected main branch: "${scoredBranches[0].branch.title}" (score: ${scoredBranches[0].score})`)
  return scoredBranches[0].branch
}

/**
 * Calculate a numerical score for a branch to determine its importance
 * Higher scores indicate more "main story" characteristics
 */
function calculateBranchScore(branch: StoryBranch): number {
  let score = 0
  
  // Longer branches (more nodes) are more likely to be main story
  score += branch.nodes.length * 10
  
  // Branches with more content are more substantial
  score += branch.wordCount * 0.1
  
  // Complete branches are preferred over drafts
  if (branch.isComplete) score += 50
  
  // Branches with written content (not just suggestions) are more important
  const writtenNodes = branch.nodes.filter(node => node.status === 'written').length
  score += writtenNodes * 15
  
  return score
}

/**
 * Create an empty branch for edge cases where no valid branches exist
 */
function createEmptyBranch(): StoryBranch {
  return {
    id: 'empty_branch',
    title: 'Empty Story',
    nodes: [],
    wordCount: 0,
    characterCount: 0,
    isComplete: false
  }
}

/**
 * Get a linear story text from a branch, respecting the narrative flow
 * This assembles the actual readable story content from connected nodes
 */
export function getLinearStoryFromBranch(branch: StoryBranch): string {
  if (branch.nodes.length === 0) {
    return ''
  }
  
  // Combine all node content in the order they appear in the branch
  const storyParts = branch.nodes.map(node => {
    // Clean HTML content and add proper formatting
    const cleanContent = node.content.replace(/<[^>]*>/g, '').trim()
    
    if (!cleanContent) {
      return `[${node.title}]` // Placeholder for empty nodes
    }
    
    // Add scene breaks between nodes for readability
    return cleanContent
  }).filter(part => part.length > 0)
  
  // Join with scene breaks for a professional story format
  return storyParts.join('\n\n* * *\n\n')
}

/**
 * Export utility to get all story branches as separate text documents
 * This enables users to export different story paths independently
 */
export function exportAllBranches(storyStructure: StoryStructure): Record<string, string> {
  const exports: Record<string, string> = {}
  
  // Export main branch
  exports['main_story'] = getLinearStoryFromBranch(storyStructure.mainBranch)
  
  // Export alternate branches
  storyStructure.alternateBranches.forEach((branch, index) => {
    const key = `alternate_branch_${index + 1}`
    exports[key] = getLinearStoryFromBranch(branch)
  })
  
  return exports
}