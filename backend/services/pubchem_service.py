import httpx

class PubChemService:
    BASE_URL = "https://pubchem.ncbi.nlm.nih.gov/rest/pug"

    async def search_compound(self, name: str) -> list[dict]:
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(f"{self.BASE_URL}/compound/name/{name}/JSON")
                response.raise_for_status()
                data = response.json()
                return data.get("PC_Compounds", [])
            except Exception:
                return []

    async def get_compound_properties(self, cid: int) -> dict:
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.BASE_URL}/compound/cid/{cid}/property/MolecularWeight,MolecularFormula,XLogP,HBondDonorCount,HBondAcceptorCount,TPSA,RotatableBondCount/JSON"
                )
                response.raise_for_status()
                data = response.json()
                props = data.get("PropertyTable", {}).get("Properties", [])
                return props[0] if props else {}
            except Exception:
                return {}

    async def get_similar_compounds(self, smiles: str) -> list[dict]:
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(f"{self.BASE_URL}/compound/fastsimilarity_2d/smiles/{smiles}/cids/JSON")
                response.raise_for_status()
                data = response.json()
                cids = data.get("IdentifierList", {}).get("CID", [])
                return [{"cid": cid} for cid in cids[:5]]
            except Exception:
                return []

    async def get_3d_coordinates(self, smiles: str) -> dict:
        return {"error": "3D structure not directly available from SMILES via standard REST without CID."}

pubchem_service = PubChemService()
