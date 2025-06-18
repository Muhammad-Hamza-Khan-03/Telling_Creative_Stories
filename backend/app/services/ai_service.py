import json
import asyncio
import hashlib
from typing import List, Optional
from datetime import datetime, timedelta
import redis.asyncio as redis
from openai import AsyncOpenAI
from app.models import BranchRequest, BranchResponse, BranchOption
from app.core.config import settings
import logging
from groq import Groq
logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        # Initialize Grok API client (using OpenAI-compatible interface)
        # self.client = AsyncOpenAI(
        #     api_key=settings.GROK_API_KEY,
        #     base_url="https://api.x.ai/v1"  # Grok API endpoint
        # )
        
        self.client = Groq(api_key=settings.GROK_API_KEY)
        self.redis_client = None
        
    async def init_redis(self):
        """Initialize Redis connection for caching"""
        try:
            self.redis_client = redis.from_url(settings.REDIS_URL)
            await self.redis_client.ping()
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}")
            self.redis_client = None

    async def generate_branches(self, request: BranchRequest) -> BranchResponse:
        """Generate story branches using Grok AI"""
        start_time = datetime.now()
        
        # Check cache first
        cache_key = self._generate_cache_key(request)
        cached_result = await self._get_cached_result(cache_key)
        if cached_result:
            return BranchResponse(
                options=cached_result,
                generation_time=(datetime.now() - start_time).total_seconds(),
                cached=True
            )
        
        try:
            # Generate branches using Grok
            branches = await self._call_grok_api(request)
            
            # Cache the result
            await self._cache_result(cache_key, branches)
            
            generation_time = (datetime.now() - start_time).total_seconds()
            
            return BranchResponse(
                options=branches,
                generation_time=generation_time,
                cached=False
            )
            
        except Exception as e:
            logger.error(f"AI generation failed: {e}")
            # Fallback to mock data
            return await self._generate_fallback_branches(request)

    async def _call_grok_api(self, request: BranchRequest) -> List[BranchOption]:
        """Call Grok API for branch generation"""
        
        # Build structured prompt
        prompt = self._build_prompt(request)
        
        try:
            response = self.client.chat.completions.create(
                model='llama-3.3-70b-versatile',
                messages=[
                    {"role": "system", "content": self._get_system_prompt()},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.8,
                max_tokens=1500,
                response_format={"type": "json_object"}
            )
            
            # Parse the response
            content = response.choices[0].message.content
            parsed_response = json.loads(content)
            
            return self._parse_grok_response(parsed_response)
            
        except Exception as e:
            logger.error(f"Grok API call failed: {e}")
            raise

    def _build_prompt(self, request: BranchRequest) -> str:
        """Build structured prompt for Grok"""
        context_snippet = request.context[-500:] if len(request.context) > 500 else request.context
        
        characters_info = ""
        if request.character_names:
            characters_info = f"Main characters: {', '.join(request.character_names)}"
        
        genre_info = f"Genre: {request.genre}" if request.genre else ""
        tone_info = f"Tone: {request.tone}" if request.tone else ""
        
        prompt = f"""
Generate 3 distinct story branch options for this narrative context:

{context_snippet}

{characters_info}
{genre_info}
{tone_info}

Create 3 different story directions with:
- Variety in impact level (high/medium/low)
- Different story elements and character focuses
- Compelling next steps that feel natural

Return as JSON with this exact structure:
{{
  "branches": [
    {{
      "title": "Branch title",
      "summary": "Brief description of what happens",
      "content": "Opening paragraph of this branch (100-150 words)",
      "characters": ["character1", "character2"],
      "impact": "high|medium|low",
      "tags": ["tag1", "tag2"]
    }}
  ]
}}
"""
        return prompt

    def _get_system_prompt(self) -> str:
        """System prompt for Grok AI"""
        return """You are a creative writing assistant specializing in story branching and narrative development. 

Your role is to:
1. Analyze the given story context
2. Generate 3 diverse, compelling story branches
3. Ensure each branch has distinct impact levels and narrative directions
4. Create engaging openings that writers can build upon

Focus on:
- Narrative coherence with the existing story
- Character development opportunities
- Plot advancement potential
- Creative but believable story directions

Always respond with valid JSON in the requested format."""

    def _parse_grok_response(self, response: dict) -> List[BranchOption]:
        """Parse Grok API response into BranchOption objects"""
        branches = []
        
        for i, branch_data in enumerate(response.get("branches", [])):
            try:
                branch = BranchOption(
                    id=f"branch_{datetime.now().timestamp()}_{i}",
                    title=branch_data.get("title", f"Branch {i+1}"),
                    summary=branch_data.get("summary", ""),
                    content=branch_data.get("content", ""),
                    characters=branch_data.get("characters", []),
                    impact=branch_data.get("impact", "medium").lower(),
                    tags=branch_data.get("tags", [])
                )
                branches.append(branch)
            except Exception as e:
                logger.warning(f"Failed to parse branch {i}: {e}")
                continue
        
        # Ensure we have 3 branches
        while len(branches) < 3:
            branches.append(self._create_fallback_branch(len(branches)))
        
        return branches[:3]

    def _create_fallback_branch(self, index: int) -> BranchOption:
        """Create fallback branch when parsing fails"""
        fallback_options = [
            {
                "title": "Unexpected Discovery",
                "summary": "A hidden truth is revealed that changes everything.",
                "content": "As the dust settled, something caught their eye—a detail that had been overlooked, something that would change the entire course of their journey.",
                "impact": "high",
                "tags": ["mystery", "revelation"]
            },
            {
                "title": "Character Encounter", 
                "summary": "A new person arrives with important information.",
                "content": "The sound of footsteps echoed in the distance. Someone was approaching, and they carried news that would shift the balance of everything.",
                "impact": "medium",
                "tags": ["character", "news"]
            },
            {
                "title": "Internal Reflection",
                "summary": "A moment of quiet contemplation and decision-making.",
                "content": "In the silence that followed, there was time to think. The weight of recent events pressed down, demanding careful consideration of what came next.",
                "impact": "low", 
                "tags": ["introspection", "decision"]
            }
        ]
        
        option = fallback_options[index % len(fallback_options)]
        return BranchOption(
            id=f"fallback_{datetime.now().timestamp()}_{index}",
            **option,
            characters=[]
        )

    async def _generate_fallback_branches(self, request: BranchRequest) -> BranchResponse:
        """Generate fallback branches when AI fails"""
        start_time = datetime.now()
        
        branches = [
            self._create_fallback_branch(0),
            self._create_fallback_branch(1), 
            self._create_fallback_branch(2)
        ]
        
        generation_time = (datetime.now() - start_time).total_seconds()
        
        return BranchResponse(
            options=branches,
            generation_time=generation_time,
            cached=False
        )

    def _generate_cache_key(self, request: BranchRequest) -> str:
        """Generate cache key for request"""
        content = f"{request.context}_{request.genre}_{request.tone}_{','.join(request.character_names)}"
        return f"branches:{hashlib.md5(content.encode()).hexdigest()}"

    async def _get_cached_result(self, cache_key: str) -> Optional[List[BranchOption]]:
        """Get cached result from Redis"""
        if not self.redis_client:
            return None
            
        try:
            cached = await self.redis_client.get(cache_key)
            if cached:
                data = json.loads(cached)
                return [BranchOption(**branch) for branch in data]
        except Exception as e:
            logger.warning(f"Cache retrieval failed: {e}")
        
        return None

    async def _cache_result(self, cache_key: str, branches: List[BranchOption]) -> None:
        """Cache result in Redis"""
        if not self.redis_client:
            return
            
        try:
            data = [branch.dict() for branch in branches]
            await self.redis_client.setex(
                cache_key,
                timedelta(hours=1),
                json.dumps(data)
            )
        except Exception as e:
            logger.warning(f"Cache storage failed: {e}")

# Global instance
ai_service = AIService()