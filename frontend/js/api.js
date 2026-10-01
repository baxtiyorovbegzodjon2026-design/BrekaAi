/**
 * Reka AI — API Client
 * Handles communication with the FastAPI backend.
 * Falls back to mock data when backend is unreachable (demo mode).
 */
class ApiClient {
    constructor() {
        // Smart base URL detection
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            this.baseUrl = window.location.origin + '/api';
        } else if (window.location.protocol === 'file:') {
            this.baseUrl = 'http://localhost:8000/api';
        } else {
            this.baseUrl = window.location.origin + '/api';
        }

        this.useMock = false;
        this._checkBackend();
    }

    async _checkBackend() {
        try {
            const resp = await fetch(this.baseUrl + '/health', { signal: AbortSignal.timeout(3000) });
            if (resp.ok) {
                this.useMock = false;
                console.log('[Breka AI] Backend connected ✓');
            } else {
                this.useMock = true;
            }
        } catch {
            this.useMock = true;
            console.log('[Breka AI] Backend unreachable — running in demo mode');
        }
    }

    async _post(path, body) {
        const resp = await fetch(this.baseUrl + path, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!resp.ok) {
            const err = await resp.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(err.detail || `HTTP ${resp.status}`);
        }
        return resp.json();
    }

    async _get(path) {
        const resp = await fetch(this.baseUrl + path);
        if (!resp.ok) {
            const err = await resp.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(err.detail || `HTTP ${resp.status}`);
        }
        return resp.json();
    }

    // ─── Main Discovery ──────────────────────────────────
    async discover(query) {
        if (this.useMock) return this._mockDiscover(query);
        
        const data = await this._post('/discover', { query });
        
        // Normalize backend response for the frontend
        const analysis = data.research?.analysis || {};
        const candidates = (data.candidates || []).map((c, i) => ({
            id: `mol-${i + 1}`,
            name: `BRK-${1000 + i * 42}`,
            smiles: c.smiles,
            rationale: c.rationale || '',
            expected_affinity: c.expected_affinity || 'Unknown',
            properties: {
                weight: (c.properties?.molecular_weight || 0).toFixed(1),
                logp: (c.properties?.logP || 0).toFixed(1),
                qed: (c.properties?.qed_score || 0).toFixed(2),
                lipinski: c.lipinski?.pass ? 4 - (c.lipinski?.violations || 0) : 0,
                hbd: c.properties?.hbd || 0,
                hba: c.properties?.hba || 0,
                tpsa: (c.properties?.tpsa || 0).toFixed(1),
                rotatable_bonds: c.properties?.rotatable_bonds || 0,
                synthetic_accessibility: (c.properties?.synthetic_accessibility || 0).toFixed(1),
            },
            svg: c['2d_svg'] || '<svg></svg>',
            molblock: c['3d_molblock'] || '',
            patent_draft: c.patent_draft || null,
        }));

        return {
            analysis: {
                target: analysis.target_protein || query,
                reasoning: analysis.disease_mechanism || analysis.novel_approach || '',
                existing_drugs: analysis.existing_drugs || [],
                desired_properties: analysis.desired_properties || [],
                novel_approach: analysis.novel_approach || '',
            },
            candidates,
        };
    }

    // ─── Get Single Molecule ─────────────────────────────
    async getMolecule(smiles) {
        if (this.useMock) return this._mockGetMolecule(smiles);
        
        const data = await this._get('/molecule/' + encodeURIComponent(smiles));
        return {
            sdf: data['3d_molblock'] || '',
            format: 'sdf',
            properties: data.properties || {},
            svg: data['2d_svg'] || '',
        };
    }

    // ─── Generate Report ─────────────────────────────────
    async generateReport(moleculeData) {
        if (this.useMock) return this._mockGenerateReport(moleculeData);
        
        const data = await this._post('/report', { molecule_data: moleculeData });
        const report = typeof data === 'string' ? data : 
            `PATENT DRAFT: ${data.title || moleculeData.name}\n\nABSTRACT\n${data.abstract || ''}\n\nBACKGROUND\n${data.background || ''}\n\nCLAIMS\n${(data.claims || []).map((c, i) => `${i + 1}. ${c}`).join('\n')}`;
        return { report };
    }

    // ─── Health Check ────────────────────────────────────
    async healthCheck() {
        return this._get('/health');
    }

    // ═══════════════════════════════════════════════════════
    //  MOCK DATA (for demo mode when backend is not running)
    // ═══════════════════════════════════════════════════════

    _mockDiscover(query) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    analysis: {
                        target: "Beta-amyloid aggregation pathway (APP processing)",
                        reasoning: "Inhibiting beta-amyloid aggregation prevents neurotoxic plaque formation in the brain, slowing the progression of Alzheimer's disease. Our approach targets the oligomerization step rather than monomer production.",
                        existing_drugs: ["Aducanumab (Aduhelm)", "Lecanemab (Leqembi)", "Donanemab"],
                        desired_properties: ["Blood-brain barrier permeability", "Low molecular weight", "High QED score"],
                        novel_approach: "Small molecule inhibitor targeting the beta-sheet stacking interface of amyloid-beta oligomers",
                    },
                    candidates: [
                        {
                            id: "mol-1",
                            name: "RKA-1042",
                            smiles: "CC(C)c1ccc(-c2ccc(C(=O)O)cc2)cc1",
                            rationale: "Biphenyl scaffold with carboxylic acid for hydrogen bonding to Aβ backbone amides. Isopropyl group enhances hydrophobic contact with the aggregation interface.",
                            expected_affinity: "High",
                            properties: { weight: "254.3", logp: "3.8", qed: "0.85", lipinski: 4, hbd: 1, hba: 2, tpsa: "37.3", rotatable_bonds: 3, synthetic_accessibility: "2.1" },
                            svg: `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
                                <circle cx="60" cy="100" r="30" fill="none" stroke="#00d4ff" stroke-width="2"/>
                                <circle cx="140" cy="100" r="30" fill="none" stroke="#00ff88" stroke-width="2"/>
                                <line x1="90" y1="100" x2="110" y2="100" stroke="#7c3aed" stroke-width="2"/>
                                <circle cx="60" cy="100" r="5" fill="#00d4ff"/>
                                <circle cx="140" cy="100" r="5" fill="#00ff88"/>
                                <text x="100" y="160" text-anchor="middle" fill="white" font-size="10" font-family="monospace">RKA-1042</text>
                            </svg>`,
                            molblock: '',
                            patent_draft: null,
                        },
                        {
                            id: "mol-2",
                            name: "RKA-2099",
                            smiles: "CN1C=NC2=C1C(=O)N(C(=O)N2C)C",
                            rationale: "Xanthine-class scaffold with N-methyl groups. Known to cross BBB effectively. Modified caffeine analog with enhanced binding to amyloid fibrils.",
                            expected_affinity: "Medium",
                            properties: { weight: "194.2", logp: "-0.1", qed: "0.72", lipinski: 4, hbd: 0, hba: 6, tpsa: "58.4", rotatable_bonds: 0, synthetic_accessibility: "1.5" },
                            svg: `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
                                <polygon points="70,60 130,60 150,100 130,140 70,140 50,100" fill="none" stroke="#00d4ff" stroke-width="2"/>
                                <line x1="70" y1="60" x2="130" y2="140" stroke="#7c3aed" stroke-width="1" opacity="0.5"/>
                                <line x1="130" y1="60" x2="70" y2="140" stroke="#7c3aed" stroke-width="1" opacity="0.5"/>
                                <circle cx="100" cy="100" r="5" fill="#00ff88"/>
                                <text x="100" y="170" text-anchor="middle" fill="white" font-size="10" font-family="monospace">RKA-2099</text>
                            </svg>`,
                            molblock: '',
                            patent_draft: null,
                        },
                        {
                            id: "mol-3",
                            name: "RKA-3001",
                            smiles: "O=C(O)c1ccc(NCc2ccccn2)cc1",
                            rationale: "Pyridine-aminomethyl-benzoic acid hybrid. Pyridine nitrogen chelates zinc ions in amyloid plaques; benzoic acid moiety enables salt bridge to Lys28 of Aβ.",
                            expected_affinity: "High",
                            properties: { weight: "228.3", logp: "1.9", qed: "0.91", lipinski: 4, hbd: 2, hba: 4, tpsa: "62.0", rotatable_bonds: 4, synthetic_accessibility: "1.8" },
                            svg: `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
                                <rect x="55" y="70" width="40" height="60" rx="5" fill="none" stroke="#00d4ff" stroke-width="2"/>
                                <rect x="105" y="70" width="40" height="60" rx="5" fill="none" stroke="#00ff88" stroke-width="2"/>
                                <line x1="95" y1="100" x2="105" y2="100" stroke="#7c3aed" stroke-width="2"/>
                                <circle cx="75" cy="70" r="4" fill="#ff4444"/>
                                <circle cx="125" cy="130" r="4" fill="#4444ff"/>
                                <text x="100" y="170" text-anchor="middle" fill="white" font-size="10" font-family="monospace">RKA-3001</text>
                            </svg>`,
                            molblock: '',
                            patent_draft: null,
                        },
                    ],
                });
            }, 2500);
        });
    }

    _mockGetMolecule(smiles) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Caffeine 3D SDF data for demo
                const caffeineSDF = `
  3Dmol.js  10012610563D 1   1.00000     0.00000
 14 15  0  0  0  0  0  0  0  0999 V2000
    1.2269   -0.5739    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
    0.2831    0.3705    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.7303    1.6961    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.1009    1.7370    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
    2.6515    0.4357    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.1120    0.0463    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.5583   -1.2583    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
   -0.6559   -2.2033    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.7207   -1.9213    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.9363    1.0028    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
   -1.1293   -3.3283    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
    4.1132    0.1601    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.9248    2.9298    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -3.0076   -1.5036    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
  1  5  1  0  0  0  0
  1  9  1  0  0  0  0
  2  3  2  0  0  0  0
  2  6  1  0  0  0  0
  3  4  1  0  0  0  0
  4  5  2  0  0  0  0
  4 13  1  0  0  0  0
  5 12  1  0  0  0  0
  6  7  1  0  0  0  0
  6 10  2  0  0  0  0
  7  8  1  0  0  0  0
  7 14  1  0  0  0  0
  8  9  1  0  0  0  0
  8 11  2  0  0  0  0
M  END`;
                resolve({ sdf: caffeineSDF, format: 'sdf' });
            }, 300);
        });
    }

    _mockGenerateReport(moleculeData) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    report: `═══════════════════════════════════════════════════════
PATENT APPLICATION DRAFT
Compound: ${moleculeData.name || 'Unknown'}
SMILES: ${moleculeData.smiles || 'N/A'}
═══════════════════════════════════════════════════════

FIELD OF THE INVENTION
The present invention relates to novel small molecule 
compounds, pharmaceutical compositions thereof, and 
methods for treating neurodegenerative disorders.

BACKGROUND OF THE INVENTION
Alzheimer's disease (AD) affects over 55 million people 
worldwide. Current therapies target amyloid-beta (Aβ) 
with monoclonal antibodies, but small molecule inhibitors 
offer advantages in oral bioavailability and cost.

SUMMARY OF THE INVENTION
Compound ${moleculeData.name} (MW: ${moleculeData.properties?.weight || 'N/A'} Da, 
QED: ${moleculeData.properties?.qed || 'N/A'}) demonstrates:
• Favorable drug-likeness (Lipinski Rule of Five: PASS)
• Predicted blood-brain barrier permeability (LogP: ${moleculeData.properties?.logp || 'N/A'})
• Novel mechanism of action targeting Aβ oligomerization

CLAIMS
1. A compound of the formula ${moleculeData.smiles} or a 
   pharmaceutically acceptable salt thereof.
2. A pharmaceutical composition comprising the compound 
   of claim 1 and a pharmaceutically acceptable carrier.
3. A method of treating Alzheimer's disease comprising 
   administering a therapeutically effective amount of the 
   compound of claim 1 to a patient in need thereof.
4. The method of claim 3, wherein the compound is 
   administered orally at a dose of 1-500 mg/day.

═══════════════════════════════════════════════════════
Generated by Breka AI — Autonomous Scientific Discovery
═══════════════════════════════════════════════════════`
                });
            }, 800);
        });
    }
}

window.api = new ApiClient();
