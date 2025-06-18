from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class NodeStatus(str, Enum):
    DRAFT = "draft"
    WRITTEN = "written"
    SUGGESTION = "suggestion"

class Position(BaseModel):
    x: float
    y: float

class StoryNode(BaseModel):
    id: str
    content: str
    title: str
    position: Position
    connections: List[str] = []
    status: NodeStatus = NodeStatus.DRAFT
    created_at: datetime
    updated_at: datetime
    word_count: int = 0
    character_count: int = 0
    tags: List[str] = []
    notes: str = ""

class StoryProject(BaseModel):
    id: str
    title: str
    description: str = ""
    created_at: datetime
    updated_at: datetime
    genre: str = ""
    target_word_count: Optional[int] = None

# Branch Generation Models
class BranchRequest(BaseModel):
    context: str = Field(..., max_length=1000, description="Story context for branch generation")
    current_node_id: str
    character_names: List[str] = []
    genre: str = ""
    tone: str = "neutral"

class BranchOption(BaseModel):
    id: str
    title: str
    summary: str
    content: str
    characters: List[str] = []
    impact: str = Field(..., pattern="^(low|medium|high)$")
    tags: List[str] = []

class BranchResponse(BaseModel):
    options: List[BranchOption]
    generation_time: float
    cached: bool = False

# Analysis Models (Narrative DNA)
class EmotionalArc(BaseModel):
    tension_score: int = Field(..., ge=0, le=100)
    peak_moment: str
    emotional_points: List[Dict[str, Any]] = []

class CharacterDevelopment(BaseModel):
    protagonist_growth: str
    relationship_matrix: Dict[str, Any] = {}
    character_arcs: List[Dict[str, Any]] = []

class ThemeConsistency(BaseModel):
    core_theme: str
    consistency_score: int = Field(..., ge=0, le=100)
    theme_mentions: List[Dict[str, Any]] = []

class PacingAnalysis(BaseModel):
    action_vs_dialogue_ratio: str
    slow_sections: List[str] = []
    pacing_score: int = Field(..., ge=0, le=100)

class NarrativeDNA(BaseModel):
    emotional_arc: EmotionalArc
    character_development: CharacterDevelopment
    theme_consistency: ThemeConsistency
    pacing_analysis: PacingAnalysis
    comparative_insights: List[str] = []
    analysis_timestamp: datetime

class AnalysisRequest(BaseModel):
    nodes: List[StoryNode]
    project_info: StoryProject

# Export Models
class ExportFormat(str, Enum):
    PDF = "pdf"
    EPUB = "epub"
    TXT = "txt"

class ExportRequest(BaseModel):
    nodes: List[StoryNode]
    project: StoryProject
    format: ExportFormat
    include_metadata: bool = True
    custom_styling: Dict[str, Any] = {}

class ExportResponse(BaseModel):
    download_url: str
    file_size: int
    export_time: float

# User & Authentication Models
class User(BaseModel):
    id: str
    email: str
    subscription_tier: str = "free"  # free, pro
    api_calls_today: int = 0
    created_at: datetime

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[str] = None

# API Response Models
class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
    error_code: Optional[str] = None

class HealthCheck(BaseModel):
    status: str
    timestamp: datetime
    version: str = "1.0.0"
    services: Dict[str, str] = {}

# Rate Limiting Models
class UsageStats(BaseModel):
    user_id: str
    daily_ai_calls: int
    monthly_analysis_calls: int
    last_reset: datetime
    subscription_tier: str