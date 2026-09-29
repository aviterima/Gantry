"""Optional HTTPS research service; no synthetic fallback or implicit approval."""

import os
from urllib.parse import urlparse

import httpx

from .models import DIMENSIONS, Candidate, ResearchCorpus


def configured() -> bool:
    u = urlparse(os.environ.get("GANTRY_RESEARCH_URL", ""))
    return u.scheme == "https" and bool(u.hostname) and not u.username and not u.password


async def research_candidate(candidate: Candidate) -> ResearchCorpus:
    if not configured():
        raise RuntimeError("Research provider is not configured")
    headers = {}
    token = os.environ.get("GANTRY_RESEARCH_TOKEN")
    if token:
        headers["Authorization"] = "Bearer " + token
    async with httpx.AsyncClient(timeout=60, follow_redirects=False) as client:
        response = await client.post(
            os.environ["GANTRY_RESEARCH_URL"],
            headers=headers,
            json={
                "candidate": {
                    k: getattr(candidate, k)
                    for k in ("slug", "name", "one_liner", "lane", "delivery_mode")
                },
                "dimensions": DIMENSIONS,
            },
        )
        response.raise_for_status()
        if len(response.content) > 512_000:
            raise ValueError("Research result exceeds size limit")
        return ResearchCorpus.model_validate(response.json())
