"""RAWI API: required screening, scenario review and audited approval workflow."""
import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from workflow import router

load_dotenv()
app = FastAPI(title='RAWI Campaign API', version='0.3.0')
app.add_middleware(CORSMiddleware,
    allow_origins=['http://localhost:5173', 'http://127.0.0.1:5173'],
    allow_credentials=True, allow_methods=['*'], allow_headers=['*'])
app.include_router(router)

@app.get('/api/health')
def health():
    return {'status':'ok', 'mode':'gemini' if os.getenv('GEMINI_API_KEY') else 'demo',
            'model':os.getenv('GEMINI_MODEL','gemini-2.5-flash') if os.getenv('GEMINI_API_KEY') else None,
            'workflowVersion':'0.3.0'}

@app.post('/api/generate')
@app.post('/api/agent/{step}')
def legacy_generation(step: str = ''):
    raise HTTPException(410, 'Use the guided campaign workflow. Initial screening and scenario approval are required.')
