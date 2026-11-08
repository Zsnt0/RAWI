import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, StringConstraints
from dotenv import load_dotenv
from typing import Annotated
load_dotenv()
app=FastAPI(title='RAWI Campaign API',version='0.1.0')
app.add_middleware(CORSMiddleware,allow_origins=['http://localhost:5173','http://127.0.0.1:5173'],allow_credentials=True,allow_methods=['*'],allow_headers=['*'])
class CampaignRequest(BaseModel):
    brand:Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)]
    product:Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=160)]
    audience:str='Young adults'
    platform:str='TikTok'
    trend:str='Nostalgia'
    goal:str='Brand awareness'
    description:str=Field(default='', max_length=2000)
class Scene(BaseModel):
    scene: int
    duration: str
    visual: str
    voiceover: str

class PostingStep(BaseModel):
    day: str
    task: str

class GeneratedCampaign(BaseModel):
    title: str
    concept: str
    script: list[Scene] = Field(min_length=1)
    caption: str
    hashtags: list[str]
    postingPlan: list[PostingStep] = Field(min_length=1)

@app.get('/api/health')
def health():return {'status':'ok','mode':'gemini' if os.getenv('GEMINI_API_KEY') else 'demo'}
@app.get('/api/trends')
def trends():return [{'name':n,'description':d} for n,d in [('Nostalgia','Retro-inspired storytelling'),('POV','First-person relatable moments'),('Unboxing','Reveal the product as a surprise'),('Before & After','Show a transformation'),('Day in the Life','Place the product into a daily routine')]]
def demo_campaign(req):
    title=f'{req.product}: The {req.trend} Edit'
    return {'title':title,'concept':f'A {req.trend.lower()}-inspired {req.platform} campaign for {req.brand}, presenting {req.product} to {req.audience} with a memorable visual hook.','script':[{'scene':1,'duration':'0–3s','visual':f'Open with a relatable moment for {req.audience}.','voiceover':'Ever had this feeling?'},{'scene':2,'duration':'3–8s','visual':f'Reveal {req.product} with a {req.trend.lower()} transition.','voiceover':f'Meet your new favorite: {req.product}.'},{'scene':3,'duration':'8–15s','visual':f'Show {req.product} in use, then end on the {req.brand} name.','voiceover':'Make the moment yours.'}],'caption':f'Your next favorite moment starts here ✨ Discover {req.product} from {req.brand}. #RAWI #SmallBusiness #{req.platform.replace(" ","")}', 'hashtags':['#RAWI','#SmallBusiness',f'#{req.trend.replace(" ","")}'],'postingPlan':[{'day':'Day 1','task':'Prepare visuals and review script'},{'day':'Day 2','task':'Produce campaign content'},{'day':'Day 3','task':f'Publish on {req.platform}'},{'day':'Day 5','task':'Review reach and engagement'}],'generationMode':'demo'}
@app.post('/api/generate')
def generate(req:CampaignRequest):
    key=os.getenv('GEMINI_API_KEY')
    if not key:return demo_campaign(req)
    try:
        from google import genai
        client=genai.Client(api_key=key)
        prompt=f'''You are a creative marketing strategist for Saudi small businesses.
          Create an achievable short-form marketing campaign.
            Return ONLY a valid JSON object with keys: title (string), 
            concept (string), script (array of objects with scene integer,
              duration string, visual string, voiceover string), caption (string),
                hashtags (array of strings), postingPlan (array of objects with day and task strings). No markdown. Input: {req.model_dump_json()}. 
                Avoid inventing real-time trend popularity or performance results.'''
        response=client.models.generate_content(model='gemini-2.5-flash',contents=prompt,config={'response_mime_type':'application/json'})
        data=GeneratedCampaign.model_validate_json(response.text).model_dump()
        data['generationMode']='gemini';return data
    except Exception as exc:
        raise HTTPException(status_code=502,detail=f'Gemini generation failed: {type(exc).__name__}. Check your API key and retry.')

