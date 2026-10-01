import httpx

class ChemblService:
    BASE_URL = "https://www.ebi.ac.uk/chembl/api/data"

    async def search_target(self, query: str) -> list[dict]:
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(f"{self.BASE_URL}/target/search", params={"q": query, "format": "json"})
                response.raise_for_status()
                data = response.json()
                return data.get("targets", [])
            except Exception:
                return []

    async def get_bioactivity(self, target_id: str) -> list[dict]:
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(f"{self.BASE_URL}/activity", params={"target_chembl_id": target_id, "limit": 5, "format": "json"})
                response.raise_for_status()
                data = response.json()
                return data.get("activities", [])
            except Exception:
                return []

    async def get_approved_drugs(self, target_id: str) -> list[dict]:
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.BASE_URL}/mechanism", params={"target_chembl_id": target_id, "format": "json"}
                )
                response.raise_for_status()
                data = response.json()
                mechs = data.get("mechanisms", [])
                drugs = []
                for m in mechs:
                    if m.get("molecule_chembl_id"):
                        drugs.append({"molecule_chembl_id": m["molecule_chembl_id"], "action_type": m.get("action_type")})
                return drugs
            except Exception:
                return []

chembl_service = ChemblService()
