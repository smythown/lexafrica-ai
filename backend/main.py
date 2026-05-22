"""
LexAfrica AI — FastAPI Backend
4-agent pipeline: Intake → Research → Advisor → Document
Powered by Llama 3.3 70B + Bright Data Web Intelligence
"""

import os, json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from utils.pdf_generator import generate_pdf
import uvicorn
import httpx
import asyncio
from datetime import datetime

load_dotenv()

app = FastAPI(title="LexAfrica AI", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Groq LLM ─────────────────────────────────────────────────────────────────
def get_llm(temperature=0.3):
    return ChatGroq(
        api_key=os.getenv("GROQ_API_KEY"),
        model=os.getenv("GROQ_MODEL"),
        temperature=temperature,
    )

# ── Request / Response schemas ───────────────────────────────────────────────
class LegalQuery(BaseModel):
    problem: str
    country: str = "Nigeria"
    language: str = "English"

class LegalResponse(BaseModel):
    domain: str
    rights: list[str]
    advice: str
    next_steps: list[str]
    legal_letter: str
    disclaimer: str
    sources: list[dict] = []

# ── Bright Data Web Research ─────────────────────────────────────────────────
async def bright_data_research(domain: str, country: str, problem: str) -> dict:
    """Fetch real-time legal information using Bright Data SERP API and Web Unlocker"""
    bright_data_key = os.getenv("BRIGHT_DATA_KEY")
    if not bright_data_key:
        return {"sources": [], "raw_content": ""}
    
    year = datetime.now().year
    queries = [
        f"{country} {domain} law rights {year}",
        f"{country} legal aid {domain}"
    ]
    
    sources = []
    raw_content = ""
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Search with SERP API
            for query in queries[:1]:  # Use first query to avoid rate limits
                try:
                    serp_response = await client.get(
                        "https://api.brightdata.com/serp/google",
                        params={"q": query, "num": 3},
                        headers={"Authorization": f"Bearer {bright_data_key}"}
                    )
                    
                    if serp_response.status_code == 200:
                        serp_data = serp_response.json()
                        organic_results = serp_data.get("organic_results", [])[:3]
                        
                        for result in organic_results:
                            sources.append({
                                "url": result.get("link", ""),
                                "title": result.get("title", ""),
                                "snippet": result.get("snippet", "")
                            })
                except Exception as e:
                    print(f"SERP API error: {e}")
            
            # Fetch content from top result using Web Unlocker
            if sources:
                try:
                    top_url = sources[0]["url"]
                    unlocker_response = await client.get(
                        "https://api.brightdata.com/unlocker/raw",
                        params={"url": top_url},
                        headers={"Authorization": f"Bearer {bright_data_key}"}
                    )
                    
                    if unlocker_response.status_code == 200:
                        raw_content = unlocker_response.text[:2000]  # Limit to 2000 chars
                except Exception as e:
                    print(f"Web Unlocker error: {e}")
    
    except Exception as e:
        print(f"Bright Data research error: {e}")
    
    return {"sources": sources, "raw_content": raw_content}

# ── Agent 1: INTAKE — classify the legal domain ──────────────────────────────
def intake_agent(problem: str, country: str) -> dict:
    llm = get_llm(temperature=0.1)
    messages = [
        SystemMessage(content="""You are a legal intake specialist for African law.
Classify the user's legal problem into exactly one domain.
Respond ONLY with valid JSON, no markdown, no extra text.
Format: {"domain": "...", "sub_domain": "...", "urgency": "low|medium|high", "keywords": [...]}
Domains: Tenancy, Employment, Contract, Criminal, Family, Land/Property, Consumer Rights, Human Rights, Immigration, Business/Corporate"""),
        HumanMessage(content=f"Country: {country}\nProblem: {problem}")
    ]
    res = llm.invoke(messages)
    return json.loads(res.content.strip())

# ── Agent 2: RESEARCH — pull relevant laws & rights with LIVE web data ───────
async def research_agent(problem: str, intake: dict, country: str) -> dict:
    # Fetch live web data from Bright Data
    web_data = await bright_data_research(intake['domain'], country, problem)
    
    llm = get_llm(temperature=0.2)
    
    # Build context with live web sources
    web_context = ""
    if web_data["sources"]:
        web_context = "\n\nLIVE WEB SOURCES:\n"
        for i, source in enumerate(web_data["sources"], 1):
            web_context += f"{i}. {source['title']}\n   URL: {source['url']}\n   {source['snippet']}\n\n"
    
    if web_data["raw_content"]:
        web_context += f"\nWEB CONTENT EXTRACT:\n{web_data['raw_content'][:1000]}\n"
    
    messages = [
        SystemMessage(content=f"""You are a legal researcher for {country} law.
Use the following LIVE web data to find applicable laws and rights.
Always cite the source URLs when referencing web information.
Respond ONLY with valid JSON, no markdown.
Format: {{
  "applicable_laws": ["law 1", "law 2"],
  "user_rights": ["right 1", "right 2"],
  "relevant_bodies": ["body 1"],
  "time_limits": "any deadlines",
  "sources_used": ["url1", "url2"]
}}"""),
        HumanMessage(content=f"""Domain: {intake['domain']}
Sub-domain: {intake['sub_domain']}
Problem: {problem}
{web_context}""")
    ]
    
    res = llm.invoke(messages)
    research_data = json.loads(res.content.strip())
    research_data["web_sources"] = web_data["sources"]
    
    return research_data

# ── Agent 3: ADVISOR — plain language advice + next steps ────────────────────
def advisor_agent(problem: str, intake: dict, research: dict, country: str, language: str = "English") -> dict:
    llm = get_llm(temperature=0.4)
    messages = [
        SystemMessage(content=f"""You are a compassionate legal advisor helping everyday citizens in {country}.
Write clear, plain-language advice in {language}. Avoid legal jargon.
Respond ONLY with valid JSON, no markdown.
Format: {{
  "summary": "2-3 sentence plain summary of their situation",
  "advice": "detailed practical advice paragraph",
  "next_steps": ["step 1", "step 2", "step 3"],
  "warning": "any important caution"
}}"""),
        HumanMessage(content=f"""Problem: {problem}
Domain: {intake['domain']} — Urgency: {intake['urgency']}
Rights: {json.dumps(research['user_rights'])}
Laws: {json.dumps(research['applicable_laws'])}""")
    ]
    res = llm.invoke(messages)
    return json.loads(res.content.strip())

# ── Agent 4: DOCUMENT — generate a formal legal letter ───────────────────────
def document_agent(problem: str, intake: dict, advisor: dict, country: str, language: str = "English") -> str:
    llm = get_llm(temperature=0.3)
    messages = [
        SystemMessage(content=f"""You are a legal document drafter for {country}.
Write a formal legal letter in {language} that the user can send to the relevant party or authority.
Use proper legal letter format with [SENDER NAME], [DATE], [RECIPIENT] placeholders.
The letter should be firm, professional, and cite the relevant legal basis.
Return ONLY the letter text, no JSON, no extra commentary."""),
        HumanMessage(content=f"""Problem: {problem}
Domain: {intake['domain']}
Next steps: {json.dumps(advisor['next_steps'])}
Advice summary: {advisor['summary']}""")
    ]
    res = llm.invoke(messages)
    return res.content.strip()

# ── Main pipeline endpoint ────────────────────────────────────────────────────
@app.post("/api/analyze", response_model=LegalResponse)
async def analyze(query: LegalQuery):
    try:
        # Run the 4-agent pipeline sequentially
        intake   = intake_agent(query.problem, query.country)
        research = await research_agent(query.problem, intake, query.country)
        advisor  = advisor_agent(query.problem, intake, research, query.country, query.language)
        letter   = document_agent(query.problem, intake, advisor, query.country, query.language)

        return LegalResponse(
            domain=f"{intake['domain']} — {intake.get('sub_domain', '')}",
            rights=research.get("user_rights", []),
            advice=advisor.get("advice", ""),
            next_steps=advisor.get("next_steps", []),
            legal_letter=letter,
            disclaimer="This is AI-generated legal information enhanced with live web data. "
                       "Not legal advice. Consult a qualified lawyer for your specific situation.",
            sources=research.get("web_sources", [])
        )
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Agent parsing error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── PDF download endpoint ─────────────────────────────────────────────────────
@app.post("/api/download-pdf")
async def download_pdf(data: LegalResponse):
    from fastapi.responses import StreamingResponse
    import io
    pdf_bytes = generate_pdf(data.dict())
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=lexafrica-legal-report.pdf"}
    )

@app.get("/")
def root():
    return {"status": "LexAfrica AI v2.0 - Powered by Bright Data", "model": os.getenv("GROQ_MODEL")}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
