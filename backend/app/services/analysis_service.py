import re
import statistics
from typing import List, Dict, Any
from datetime import datetime
from collections import Counter
from app.models import (
    StoryNode, AnalysisRequest, NarrativeDNA,
    EmotionalArc, CharacterDevelopment, ThemeConsistency, PacingAnalysis
)
import logging

logger = logging.getLogger(__name__)

class AnalysisService:
    def __init__(self):
        self.emotion_keywords = {
            'tension': ['conflict', 'tension', 'danger', 'threat', 'fear', 'suspense', 'crisis'],
            'joy': ['happy', 'joy', 'laugh', 'smile', 'celebration', 'triumph'],
            'sadness': ['sad', 'cry', 'tears', 'grief', 'loss', 'mourning'],
            'anger': ['angry', 'rage', 'fury', 'mad', 'furious', 'hostile'],
            'love': ['love', 'romance', 'affection', 'tender', 'caring', 'devotion']
        }
        
        self.character_indicators = [
            'protagonist', 'main character', 'hero', 'heroine', 'narrator'
        ]
        
        self.pacing_indicators = {
            'action': ['ran', 'rushed', 'fought', 'attacked', 'chased', 'battle', 'explosion'],
            'dialogue': ['"', "'", 'said', 'asked', 'replied', 'whispered', 'shouted'],
            'description': ['looked', 'appeared', 'seemed', 'was', 'were', 'beautiful', 'dark']
        }

    async def analyze_story(self, request: AnalysisRequest) -> NarrativeDNA:
        """Perform comprehensive story analysis"""
        try:
            # Extract full text from nodes
            full_text = self._extract_story_text(request.nodes)
            
            # Perform individual analyses
            emotional_arc = await self._analyze_emotional_arc(request.nodes, full_text)
            character_dev = await self._analyze_character_development(request.nodes, full_text)
            theme_consistency = await self._analyze_theme_consistency(request.nodes, full_text)
            pacing_analysis = await self._analyze_pacing(request.nodes, full_text)
            comparative_insights = await self._generate_comparative_insights(request.nodes, full_text)
            
            return NarrativeDNA(
                emotional_arc=emotional_arc,
                character_development=character_dev,
                theme_consistency=theme_consistency,
                pacing_analysis=pacing_analysis,
                comparative_insights=comparative_insights,
                analysis_timestamp=datetime.now()
            )
            
        except Exception as e:
            logger.error(f"Story analysis failed: {e}")
            raise

    def _extract_story_text(self, nodes: List[StoryNode]) -> str:
        """Extract and clean story text from nodes"""
        # Sort nodes by creation time to maintain story order
        sorted_nodes = sorted(nodes, key=lambda x: x.created_at)
        
        # Extract text content, removing HTML tags
        text_parts = []
        for node in sorted_nodes:
            clean_text = re.sub(r'<[^>]+>', '', node.content)
            if clean_text.strip():
                text_parts.append(clean_text.strip())
        
        return ' '.join(text_parts)

    async def _analyze_emotional_arc(self, nodes: List[StoryNode], full_text: str) -> EmotionalArc:
        """Analyze emotional tension throughout the story"""
        emotional_points = []
        tension_scores = []
        
        # Analyze each node for emotional content
        for i, node in enumerate(sorted(nodes, key=lambda x: x.created_at)):
            clean_text = re.sub(r'<[^>]+>', '', node.content).lower()
            
            # Calculate tension score based on keywords
            tension_score = 0
            for keyword in self.emotion_keywords['tension']:
                tension_score += clean_text.count(keyword) * 10
            
            # Add context-based scoring
            if any(word in clean_text for word in ['climax', 'confrontation', 'revelation']):
                tension_score += 30
            
            # Normalize score to 0-100
            tension_score = min(100, tension_score)
            tension_scores.append(tension_score)
            
            emotional_points.append({
                'scene': i + 1,
                'title': node.title,
                'tension': tension_score,
                'dominant_emotion': self._detect_dominant_emotion(clean_text)
            })
        
        # Find peak tension moment
        if tension_scores:
            max_tension_idx = tension_scores.index(max(tension_scores))
            peak_scene = sorted(nodes, key=lambda x: x.created_at)[max_tension_idx]
            peak_moment = peak_scene.title
            overall_tension = int(statistics.mean(tension_scores))
        else:
            peak_moment = "No peak identified"
            overall_tension = 0
        
        return EmotionalArc(
            tension_score=overall_tension,
            peak_moment=peak_moment,
            emotional_points=emotional_points
        )

    def _detect_dominant_emotion(self, text: str) -> str:
        """Detect the dominant emotion in text"""
        emotion_counts = {}
        
        for emotion, keywords in self.emotion_keywords.items():
            count = sum(text.count(keyword) for keyword in keywords)
            emotion_counts[emotion] = count
        
        if not any(emotion_counts.values()):
            return 'neutral'
        
        return max(emotion_counts, key=emotion_counts.get)

    async def _analyze_character_development(self, nodes: List[StoryNode], full_text: str) -> CharacterDevelopment:
        """Analyze character development and relationships"""
        # Extract character names using simple heuristics
        characters = self._extract_character_names(full_text)
        
        # Calculate protagonist growth
        protagonist_mentions = self._count_protagonist_development(full_text)
        growth_percentage = min(100, max(0, protagonist_mentions * 5))
        
        # Build relationship matrix
        relationship_matrix = self._build_relationship_matrix(characters, full_text)
        
        # Analyze character arcs
        character_arcs = []
        for char in characters[:5]:  # Limit to top 5 characters
            arc_strength = self._analyze_character_arc(char, full_text)
            character_arcs.append({
                'name': char,
                'arc_strength': arc_strength,
                'mentions': full_text.lower().count(char.lower())
            })
        
        return CharacterDevelopment(
            protagonist_growth=f"{growth_percentage}% completed",
            relationship_matrix=relationship_matrix,
            character_arcs=character_arcs
        )

    def _extract_character_names(self, text: str) -> List[str]:
        """Extract character names from text"""
        # Simple name extraction - look for capitalized words that appear frequently
        words = re.findall(r'\b[A-Z][a-z]+\b', text)
        
        # Count occurrences and filter
        name_counts = Counter(words)
        
        # Filter out common non-names
        common_words = {'The', 'And', 'But', 'When', 'Where', 'What', 'How', 'Why', 'This', 'That'}
        potential_names = [name for name, count in name_counts.items() 
                          if count >= 3 and name not in common_words and len(name) > 2]
        
        return potential_names[:10]  # Return top 10

    def _count_protagonist_development(self, text: str) -> int:
        """Count indicators of protagonist development"""
        development_indicators = [
            'learned', 'realized', 'understood', 'changed', 'grew', 'developed',
            'discovered', 'found', 'became', 'transformed'
        ]
        
        count = 0
        text_lower = text.lower()
        for indicator in development_indicators:
            count += text_lower.count(indicator)
        
        return count

    def _build_relationship_matrix(self, characters: List[str], text: str) -> Dict[str, Any]:
        """Build character relationship matrix"""
        if len(characters) < 2:
            return {}
        
        relationships = {}
        
        # Analyze co-occurrence of characters
        for i, char1 in enumerate(characters[:5]):
            for char2 in characters[i+1:6]:
                # Count sentences where both characters appear
                sentences = re.split(r'[.!?]+', text)
                co_occurrence = sum(1 for sentence in sentences 
                                  if char1.lower() in sentence.lower() and char2.lower() in sentence.lower())
                
                if co_occurrence > 0:
                    relationships[f"{char1}-{char2}"] = {
                        'strength': min(10, co_occurrence),
                        'type': 'connected'
                    }
        
        return relationships

    def _analyze_character_arc(self, character: str, text: str) -> int:
        """Analyze individual character arc strength"""
        # Look for character development indicators near character mentions
        sentences = re.split(r'[.!?]+', text)
        arc_indicators = 0
        
        for sentence in sentences:
            if character.lower() in sentence.lower():
                # Check for development words in the same sentence
                development_words = ['changed', 'learned', 'grew', 'realized', 'became', 'transformed']
                if any(word in sentence.lower() for word in development_words):
                    arc_indicators += 1
        
        return min(10, arc_indicators)

    async def _analyze_theme_consistency(self, nodes: List[StoryNode], full_text: str) -> ThemeConsistency:
        """Analyze theme consistency throughout the story"""
        # Detect themes using keyword analysis
        theme_keywords = {
            'love': ['love', 'romance', 'relationship', 'heart', 'affection'],
            'betrayal': ['betray', 'deceive', 'lie', 'cheat', 'backstab'],
            'redemption': ['redeem', 'forgive', 'second chance', 'make amends'],
            'power': ['power', 'control', 'authority', 'dominance', 'rule'],
            'identity': ['identity', 'self', 'who am i', 'belong', 'purpose'],
            'freedom': ['freedom', 'liberty', 'escape', 'independence', 'free'],
            'justice': ['justice', 'fair', 'right', 'wrong', 'moral']
        }
        
        theme_scores = {}
        text_lower = full_text.lower()
        
        for theme, keywords in theme_keywords.items():
            score = sum(text_lower.count(keyword) for keyword in keywords)
            theme_scores[theme] = score
        
        # Find dominant theme
        if theme_scores and max(theme_scores.values()) > 0:
            core_theme = max(theme_scores, key=theme_scores.get)
            theme_strength = theme_scores[core_theme]
            
            # Calculate consistency score
            total_words = len(full_text.split())
            consistency_score = min(100, int((theme_strength / max(1, total_words)) * 1000))
        else:
            core_theme = "No clear theme"
            consistency_score = 0
        
        # Find theme mentions
        theme_mentions = []
        if core_theme != "No clear theme":
            for i, node in enumerate(sorted(nodes, key=lambda x: x.created_at)):
                node_text = re.sub(r'<[^>]+>', '', node.content).lower()
                mentions = sum(node_text.count(keyword) for keyword in theme_keywords[core_theme])
                if mentions > 0:
                    theme_mentions.append({
                        'scene': i + 1,
                        'title': node.title,
                        'mentions': mentions
                    })
        
        return ThemeConsistency(
            core_theme=core_theme.title(),
            consistency_score=consistency_score,
            theme_mentions=theme_mentions
        )

    async def _analyze_pacing(self, nodes: List[StoryNode], full_text: str) -> PacingAnalysis:
        """Analyze story pacing"""
        # Count action vs dialogue vs description
        action_count = sum(full_text.lower().count(word) for word in self.pacing_indicators['action'])
        dialogue_count = full_text.count('"') + full_text.count("'")
        description_count = sum(full_text.lower().count(word) for word in self.pacing_indicators['description'])
        
        total_indicators = action_count + dialogue_count + description_count
        
        if total_indicators > 0:
            action_ratio = int((action_count / total_indicators) * 100)
            dialogue_ratio = int((dialogue_count / total_indicators) * 100)
            ratio_string = f"{action_ratio + dialogue_ratio}/{100 - action_ratio - dialogue_ratio}"
        else:
            ratio_string = "50/50"
        
        # Identify slow sections
        slow_sections = []
        for i, node in enumerate(sorted(nodes, key=lambda x: x.created_at)):
            node_text = re.sub(r'<[^>]+>', '', node.content).lower()
            
            # Check for pacing indicators
            action_in_node = sum(node_text.count(word) for word in self.pacing_indicators['action'])
            if len(node_text.split()) > 100 and action_in_node == 0:
                slow_sections.append(f"Scene {i + 1}: {node.title}")
        
        # Calculate overall pacing score
        pacing_score = min(100, max(10, action_count * 2 + dialogue_count // 2))
        
        return PacingAnalysis(
            action_vs_dialogue_ratio=ratio_string,
            slow_sections=slow_sections,
            pacing_score=pacing_score
        )

    async def _generate_comparative_insights(self, nodes: List[StoryNode], full_text: str) -> List[str]:
        """Generate comparative insights to famous works"""
        insights = []
        
        # Analyze story structure
        word_count = len(full_text.split())
        scene_count = len(nodes)
        
        # Compare to known patterns
        if scene_count >= 10 and 'mystery' in full_text.lower():
            insights.append("Your structure resembles Agatha Christie's mysteries with multiple scenes building tension")
        
        if word_count > 5000 and 'character' in full_text.lower():
            insights.append("Character dynamics similar to ensemble narratives like 'Game of Thrones'")
        
        if 'love' in full_text.lower() and 'conflict' in full_text.lower():
            insights.append("Romance with conflict elements reminiscent of Jane Austen's style")
        
        if len(insights) == 0:
            insights.append("Unique narrative structure - forge your own path!")
        
        return insights

# Global instance
analysis_service = AnalysisService()