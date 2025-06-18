from fastapi import APIRouter, HTTPException, Depends, status
from app.models import AnalysisRequest, NarrativeDNA, APIResponse
from app.services import analysis_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/analytics",
    tags=["Narrative DNA Analysis"],
    responses={404: {"description": "Not found"}},
)

@router.post("/analyze", response_model=NarrativeDNA)
async def analyze_story(request: AnalysisRequest):
    """
    Perform comprehensive Narrative DNA analysis.
    
    **Premium Feature**: Analyzes story for:
    - Emotional arc and tension patterns
    - Character development tracking
    - Theme consistency measurement
    - Pacing analysis
    - Comparative insights to famous works
    """
    try:
        # Validate request
        if not request.nodes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one story node is required"
            )
        
        # Check if story has enough content
        total_words = sum(len(node.content.split()) for node in request.nodes)
        if total_words < 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Story needs at least 100 words for meaningful analysis"
            )
        
        # Perform analysis
        result = await analysis_service.analyze_story(request)
        
        logger.info(f"Analyzed story: {request.project_info.title} with {len(request.nodes)} nodes")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Story analysis failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to analyze story"
        )

@router.post("/quick-insights", response_model=APIResponse)
async def get_quick_insights(request: AnalysisRequest):
    """
    Get quick story insights without full analysis.
    
    **Free Feature**: Basic metrics and suggestions.
    """
    try:
        if not request.nodes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one story node is required"
            )
        
        # Calculate basic metrics
        total_words = sum(len(node.content.split()) for node in request.nodes)
        total_chars = sum(len(node.content) for node in request.nodes)
        avg_words_per_scene = total_words // len(request.nodes) if request.nodes else 0
        
        # Simple status distribution
        status_counts = {}
        for node in request.nodes:
            status_counts[node.status] = status_counts.get(node.status, 0) + 1
        
        insights = {
            "word_count": total_words,
            "character_count": total_chars,
            "scene_count": len(request.nodes),
            "avg_words_per_scene": avg_words_per_scene,
            "status_distribution": status_counts,
            "suggestions": []
        }
        
        # Add basic suggestions
        if avg_words_per_scene < 200:
            insights["suggestions"].append("Consider expanding scenes - average length is quite short")
        
        if status_counts.get("draft", 0) > status_counts.get("written", 0):
            insights["suggestions"].append("You have more draft scenes than completed ones")
        
        if len(request.nodes) == 1:
            insights["suggestions"].append("Try creating connected scenes to build your story")
        
        return APIResponse(
            success=True,
            message="Quick insights generated successfully",
            data=insights
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Quick insights failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate insights"
        )

@router.get("/health")
async def health_check():
    """Check analytics service health"""
    return APIResponse(
        success=True,
        message="Analytics service is healthy",
        data={
            "service": "narrative_dna_analyzer",
            "status": "operational"
        }
    )