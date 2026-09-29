import asyncio
import json

import httpx
from fastapi.testclient import TestClient

from engine.research_service import ResearchIdea, app, build_corpus
from engine.tests.test_contract import CORPUS


def test_retrieval_synthesis_and_bias_review():
    seen = []

    def handler(request):
        body = json.loads(request.content)
        seen.append(body)
        if request.url.host == "search.test":
            return httpx.Response(
                200,
                json={
                    "results": [
                        {
                            "url": "https://example.com/evidence",
                            "title": "Evidence",
                            "content": "Pain evidence",
                        }
                    ]
                },
            )
        draft = {k: v for k, v in CORPUS.items() if k != "sources"}
        return httpx.Response(200, json={"choices": [{"message": {"content": json.dumps(draft)}}]})

    conf = {
        "GANTRY_SEARCH_URL": "https://search.test/search",
        "GANTRY_SEARCH_KEY": "test-search",
        "GANTRY_MODEL_URL": "https://model.test/chat",
        "GANTRY_MODEL_KEY": "test-model",
        "GANTRY_MODEL_NAME": "fixture",
    }
    idea = ResearchIdea(
        slug="idea",
        name="Idea",
        one_liner="A service",
        lane="vertical",
        delivery_mode="service_first",
    )

    async def run():
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            return await build_corpus(idea, client, conf)

    result = asyncio.run(run())
    assert len(seen) == 5  # 3 searches, synthesis, adversarial review
    assert len(result.sources) == 1  # deduplication
    assert result.sources[0].excerpt == "Pain evidence"
    assert "decisions" in seen[3]["messages"][0]["content"]
    assert result.proposed_scores["pain_intensity"].score == 4


def test_research_service_fails_closed(monkeypatch):
    client = TestClient(app)
    body = {
        "candidate": {
            "slug": "x",
            "name": "X",
            "one_liner": "x",
            "lane": "vertical",
            "delivery_mode": "service_first",
        },
        "dimensions": {},
    }
    monkeypatch.delenv("GANTRY_RESEARCH_SERVICE_KEY", raising=False)
    assert client.post("/research", json=body).status_code == 503
    monkeypatch.setenv("GANTRY_RESEARCH_SERVICE_KEY", "x" * 32)
    assert client.post("/research", json=body).status_code == 401
    assert (
        client.post(
            "/research", json=body, headers={"Authorization": "Bearer " + "x" * 32}
        ).status_code
        == 503
    )
