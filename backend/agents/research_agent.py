from backend.services.gemini_service import gemini_service
from backend.services.chembl_service import chembl_service

class ResearchAgent:
    async def investigate(self, query: str) -> dict:
        analysis = gemini_service.analyze_target(query)
        target_name = analysis.get("target_protein", query)
        
        chembl_targets = await chembl_service.search_target(target_name)
        
        target_id = None
        if chembl_targets:
            target_id = chembl_targets[0].get("target_chembl_id")
            
        bioactivity = []
        approved_drugs = []
        
        if target_id:
            bioactivity = await chembl_service.get_bioactivity(target_id)
            approved_drugs = await chembl_service.get_approved_drugs(target_id)
            
        return {
            "analysis": analysis,
            "chembl_target_id": target_id,
            "bioactivity_sample": bioactivity,
            "approved_drugs_sample": approved_drugs
        }

research_agent = ResearchAgent()
