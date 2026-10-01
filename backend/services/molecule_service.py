try:
    from rdkit import Chem
    from rdkit.Chem import Descriptors, Lipinski, QED, rdMolDescriptors
    from rdkit.Chem import AllChem
    from rdkit.Chem.Draw import rdMolDraw2D
    RDKIT_AVAILABLE = True
except ImportError:
    RDKIT_AVAILABLE = False

class MoleculeService:
    def validate_smiles(self, smiles: str) -> bool:
        if not RDKIT_AVAILABLE:
            return True # Fallback
        mol = Chem.MolFromSmiles(smiles)
        return mol is not None

    def calculate_properties(self, smiles: str) -> dict:
        if not RDKIT_AVAILABLE:
            return {
                "molecular_weight": 0.0, "logP": 0.0, "hbd": 0, "hba": 0,
                "tpsa": 0.0, "qed_score": 0.0, "rotatable_bonds": 0, "synthetic_accessibility": 0.0
            }
        
        mol = Chem.MolFromSmiles(smiles)
        if not mol:
            return {}

        try:
            from rdkit.Chem import RDConfig
            import sys, os
            sys.path.append(os.path.join(RDConfig.RDBASEDir, 'Contrib', 'SA_Score'))
            import sascorer
            sa_score = sascorer.calculateScore(mol)
        except Exception:
            sa_score = 0.0

        return {
            "molecular_weight": Descriptors.MolWt(mol),
            "logP": Descriptors.MolLogP(mol),
            "hbd": Lipinski.NumHDonors(mol),
            "hba": Lipinski.NumHAcceptors(mol),
            "tpsa": rdMolDescriptors.CalcTPSA(mol),
            "qed_score": QED.qed(mol),
            "rotatable_bonds": Lipinski.NumRotatableBonds(mol),
            "synthetic_accessibility": sa_score
        }

    def check_lipinski(self, properties: dict) -> dict:
        violations = 0
        if properties.get("molecular_weight", 0) > 500: violations += 1
        if properties.get("logP", 0) > 5: violations += 1
        if properties.get("hbd", 0) > 5: violations += 1
        if properties.get("hba", 0) > 10: violations += 1
        
        return {
            "pass": violations <= 1,
            "violations": violations
        }

    def get_3d_molblock(self, smiles: str) -> str:
        if not RDKIT_AVAILABLE:
            return ""
        mol = Chem.MolFromSmiles(smiles)
        if not mol:
            return ""
        mol = Chem.AddHs(mol)
        AllChem.EmbedMolecule(mol, AllChem.ETKDG())
        AllChem.MMFFOptimizeMolecule(mol)
        return Chem.MolToMolBlock(mol)

    def smiles_to_svg(self, smiles: str) -> str:
        if not RDKIT_AVAILABLE:
            return "<svg></svg>"
        mol = Chem.MolFromSmiles(smiles)
        if not mol:
            return "<svg></svg>"
        drawer = rdMolDraw2D.MolDraw2DSVG(300, 300)
        drawer.DrawMolecule(mol)
        drawer.FinishDrawing()
        return drawer.GetDrawingText()

molecule_service = MoleculeService()
