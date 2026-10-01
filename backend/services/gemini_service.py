import json
import google.generativeai as genai
from backend.config import settings

genai.configure(api_key=settings.gemini_api_key)

class GeminiService:
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-2.5-pro')

    def analyze_target(self, query: str) -> dict:
        prompt = f"""
        Analyze the following drug discovery query: "{query}"
        Return a JSON object with the following keys:
        - target_protein: string
        - disease_mechanism: string
        - desired_properties: list of strings
        - existing_drugs: list of strings
        - novel_approach: string
        
        Provide only valid JSON.
        """
        response = self.model.generate_content(prompt)
        try:
            return json.loads(response.text.strip('` \n').removeprefix('json'))
        except json.JSONDecodeError:
            return {"error": "Failed to parse JSON response."}

    def generate_molecules(self, analysis: dict) -> list[dict]:
        prompt = f"""
        Based on this target analysis: {json.dumps(analysis)}
        Generate 5 novel candidate SMILES strings for this target.
        Return a JSON array of objects, each with:
        - smiles: string
        - rationale: string
        - expected_affinity: string (e.g., "High", "Medium")
        
        Provide only valid JSON.
        """
        response = self.model.generate_content(prompt)
        try:
            return json.loads(response.text.strip('` \n').removeprefix('json'))
        except json.JSONDecodeError:
            return []

    def generate_patent_draft(self, molecule_data: dict) -> dict:
        prompt = f"""
        Draft a short patent-style document for the following molecule candidate:
        {json.dumps(molecule_data)}
        
        Return a JSON object with:
        - title: string
        - abstract: string
        - claims: list of strings
        - background: string
        
        Provide only valid JSON.
        """
        response = self.model.generate_content(prompt)
        try:
            return json.loads(response.text.strip('` \n').removeprefix('json'))
        except json.JSONDecodeError:
            return {"error": "Failed to parse JSON response."}

gemini_service = GeminiService()
