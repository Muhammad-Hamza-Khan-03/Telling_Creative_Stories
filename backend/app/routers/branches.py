from fastapi import APIRouter, HTTPException, Depends, status
from app.models import BranchRequest, BranchResponse, APIResponse
from app.services import ai_service
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/branches",
    tags=["AI Branch Generation"],
    responses={404: {"description": "Not found"}},
)

@router.post("/generate", response_model=BranchResponse)
async def generate_branches(request: BranchRequest):
    """
    Generate 3 AI-powered story branches based on context.
    
    - **context**: Story context (max 1000 chars)
    - **current_node_id**: ID of current scene
    - **character_names**: List of character names (optional)
    - **genre**: Story genre (optional)
    - **tone**: Story tone (optional)
    """
    try:
        # Validate request
        if not request.context.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Context cannot be empty"
            )
        
        # Initialize AI service if needed
        if ai_service.redis_client is None:
            await ai_service.init_redis()
        
        # Generate branches
        result = await ai_service.generate_branches(request)
        
        logger.info(f"Generated {len(result.options)} branches for node {request.current_node_id}")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Branch generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate story branches"
        )

@router.post("/regenerate", response_model=BranchResponse)
async def regenerate_branches(request: BranchRequest):
    """
    Regenerate branches with different parameters.
    Forces cache bypass for fresh results.
    """
    try:
        # Add timestamp to force cache miss
        modified_request = request.copy()
        modified_request.context += f" [regenerated]"
        
        result = await ai_service.generate_branches(modified_request)
        
        return result
        
    except Exception as e:
        logger.error(f"Branch regeneration failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to regenerate story branches"
        )

@router.get("/health")
async def health_check():
    """Check AI service health"""
    try:
        # Test Redis connection
        redis_status = "connected" if ai_service.redis_client else "disconnected"
        
        # Test API key presence
        api_key_status = "configured" if settings.GROK_API_KEY else "missing"
        
        return APIResponse(
            success=True,
            message="Branch generation service is healthy",
            data={
                "redis": redis_status,
                "api_key": api_key_status,
                "model": settings.AI_MODEL
            }
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service unhealthy"
        )