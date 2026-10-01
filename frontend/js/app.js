/**
 * Reka AI — Main Application Controller
 * Manages the Discovery Lab UI, renders results, and orchestrates
 * the 3D molecule viewer and property dashboards.
 */
class RekaApp {
    constructor() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        this.initElements();
        this.bindEvents();
        this.currentCandidates = [];
    }

    initElements() {
        this.searchInput = document.getElementById('search-input');
        this.discoverBtn = document.getElementById('btn-discover');
        this.loadingContainer = document.getElementById('loading-container');
        this.resultsContainer = document.getElementById('results-container');
        this.analysisContent = document.getElementById('analysis-content');
        this.candidatesGrid = document.getElementById('candidates-grid');
        this.propertiesDashboard = document.getElementById('properties-dashboard');
        this.patentReport = document.getElementById('patent-report');
        this.patentContent = document.getElementById('patent-content');
        this.patentToggle = document.getElementById('patent-toggle');
    }

    bindEvents() {
        this.discoverBtn.addEventListener('click', () => {
            const query = this.searchInput.value.trim();
            if (query) this.startDiscovery(query);
        });

        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.discoverBtn.click();
        });

        this.patentToggle.addEventListener('click', () => {
            this.patentReport.classList.toggle('expanded');
        });

        // 3D Viewer Controls
        document.getElementById('btn-stick').addEventListener('click', () => window.moleculeViewer.setStyle('stick'));
        document.getElementById('btn-sphere').addEventListener('click', () => window.moleculeViewer.setStyle('sphere'));
        document.getElementById('btn-spin').addEventListener('click', () => {
            window.moleculeViewer.spin(!window.moleculeViewer.isSpinning);
        });
        document.getElementById('btn-reset').addEventListener('click', () => window.moleculeViewer.reset());
    }

    // ─── Discovery Flow ──────────────────────────────────
    async startDiscovery(query) {
        this.showLoading();
        this.discoverBtn.disabled = true;

        const steps = [
            '🔬 Analyzing your query...',
            '📚 Searching scientific literature...',
            '🧬 Generating novel molecular structures...',
            '⚗️ Running in-silico verification...',
            '📊 Ranking candidates by drug-likeness...',
            '📝 Preparing discovery report...',
        ];
        let stepIdx = 0;
        const stepEl = document.getElementById('loading-step');
        const stepInterval = setInterval(() => {
            if (stepIdx < steps.length) {
                stepEl.textContent = steps[stepIdx++];
            }
        }, 2000);

        try {
            const data = await window.api.discover(query);
            clearInterval(stepInterval);
            this.hideLoading();
            this.discoverBtn.disabled = false;

            this.currentCandidates = data.candidates || [];

            // Render analysis
            this.renderAnalysis(data.analysis);

            // Render candidate cards
            this.renderCandidates(this.currentCandidates);

            // Init 3D viewer if needed
            if (!window.moleculeViewer.viewer) {
                window.moleculeViewer.init('mol-viewer');
            }

            // Select first candidate
            if (this.currentCandidates.length > 0) {
                this.selectMolecule(this.currentCandidates[0]);
            }

            // Show results
            this.resultsContainer.classList.add('active');

            // Smooth scroll
            setTimeout(() => {
                this.resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 200);

        } catch (error) {
            clearInterval(stepInterval);
            this.hideLoading();
            this.discoverBtn.disabled = false;
            this.showError('Discovery failed: ' + error.message);
        }
    }

    // ─── Render Analysis Panel ───────────────────────────
    renderAnalysis(analysis) {
        if (!analysis) {
            this.analysisContent.innerHTML = '<p>No analysis available.</p>';
            return;
        }

        const drugsHtml = (analysis.existing_drugs || [])
            .map(d => `<span style="display:inline-block;background:rgba(124,58,237,0.2);border:1px solid rgba(124,58,237,0.4);padding:0.2rem 0.6rem;border-radius:20px;font-size:0.8rem;margin:0.2rem;">${d}</span>`)
            .join(' ');

        const propsHtml = (analysis.desired_properties || [])
            .map(p => `<span style="display:inline-block;background:rgba(0,212,255,0.1);border:1px solid rgba(0,212,255,0.3);padding:0.2rem 0.6rem;border-radius:20px;font-size:0.8rem;margin:0.2rem;">${p}</span>`)
            .join(' ');

        this.analysisContent.innerHTML = `
            <div style="margin-bottom:1rem;">
                <div style="color:var(--accent-green);font-weight:600;margin-bottom:0.3rem;">🎯 Target</div>
                <p>${analysis.target || 'Unknown'}</p>
            </div>
            <div style="margin-bottom:1rem;">
                <div style="color:var(--accent-green);font-weight:600;margin-bottom:0.3rem;">🧠 Mechanism & Approach</div>
                <p>${analysis.reasoning || 'N/A'}</p>
            </div>
            ${analysis.novel_approach ? `<div style="margin-bottom:1rem;">
                <div style="color:var(--accent-green);font-weight:600;margin-bottom:0.3rem;">💡 Novel Approach</div>
                <p>${analysis.novel_approach}</p>
            </div>` : ''}
            ${drugsHtml ? `<div style="margin-bottom:1rem;">
                <div style="color:var(--accent-green);font-weight:600;margin-bottom:0.3rem;">💊 Existing Drugs</div>
                <div>${drugsHtml}</div>
            </div>` : ''}
            ${propsHtml ? `<div>
                <div style="color:var(--accent-green);font-weight:600;margin-bottom:0.3rem;">🔧 Desired Properties</div>
                <div>${propsHtml}</div>
            </div>` : ''}
        `;
    }

    // ─── Render Candidate Cards ──────────────────────────
    renderCandidates(candidates) {
        this.candidatesGrid.innerHTML = '';

        candidates.forEach((cand, idx) => {
            const card = document.createElement('div');
            card.className = 'glass-panel candidate-card';
            card.innerHTML = `
                <h4 style="display:flex;justify-content:space-between;align-items:center;">
                    <span>${cand.name || `Candidate ${idx + 1}`}</span>
                    <span style="font-size:0.75rem;color:var(--accent-blue);background:rgba(0,212,255,0.1);padding:0.2rem 0.5rem;border-radius:10px;">${cand.expected_affinity || ''}</span>
                </h4>
                <div class="candidate-svg">${cand.svg || '<svg></svg>'}</div>
                <div style="font-size:0.85rem;color:var(--text-secondary);display:flex;gap:0.8rem;flex-wrap:wrap;">
                    <span>⚖️ MW: ${cand.properties?.weight || '?'}</span>
                    <span>💧 LogP: ${cand.properties?.logp || '?'}</span>
                    <span>⭐ QED: ${cand.properties?.qed || '?'}</span>
                </div>
                ${cand.rationale ? `<p style="font-size:0.8rem;color:var(--text-secondary);margin-top:0.5rem;opacity:0.8;">${cand.rationale.substring(0, 120)}${cand.rationale.length > 120 ? '...' : ''}</p>` : ''}
            `;
            card.addEventListener('click', () => {
                document.querySelectorAll('.candidate-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                this.selectMolecule(cand);
            });
            this.candidatesGrid.appendChild(card);
        });

        if (this.candidatesGrid.firstChild) {
            this.candidatesGrid.firstChild.classList.add('active');
        }
    }

    // ─── Select a Molecule ───────────────────────────────
    async selectMolecule(molecule) {
        // Render properties dashboard
        this.renderProperties(molecule.properties);

        // Load 3D structure
        try {
            if (molecule.molblock) {
                window.moleculeViewer.loadMolecule(molecule.molblock, 'sdf');
            } else {
                const molData = await window.api.getMolecule(molecule.smiles);
                window.moleculeViewer.loadMolecule(molData.sdf, molData.format || 'sdf');
            }
        } catch (e) {
            console.warn('Could not load 3D structure:', e.message);
        }

        // Generate patent report
        this.patentContent.textContent = '⏳ Generating patent draft...';
        this.patentReport.classList.remove('expanded');
        try {
            if (molecule.patent_draft && typeof molecule.patent_draft === 'object' && molecule.patent_draft.title) {
                const pd = molecule.patent_draft;
                this.renderPatentReport(
                    `TITLE: ${pd.title}\n\nABSTRACT\n${pd.abstract}\n\nBACKGROUND\n${pd.background}\n\nCLAIMS\n${(pd.claims || []).map((c, i) => `${i + 1}. ${c}`).join('\n')}`
                );
            } else {
                const reportData = await window.api.generateReport(molecule);
                this.renderPatentReport(reportData.report);
            }
        } catch (e) {
            this.patentContent.textContent = 'Could not generate patent draft.';
        }
    }

    // ─── Render Properties Dashboard ─────────────────────
    renderProperties(props) {
        if (!props) {
            this.propertiesDashboard.innerHTML = '<p>No properties available.</p>';
            return;
        }

        const gauges = [
            { label: 'Molecular Weight', value: props.weight, max: 600, unit: 'Da', color: '#00d4ff' },
            { label: 'LogP', value: props.logp, max: 6, unit: '', color: '#7c3aed' },
            { label: 'QED Score', value: props.qed, max: 1, unit: '', color: '#00ff88' },
            { label: 'H-Bond Donors', value: props.hbd, max: 5, unit: '', color: '#ff6b6b' },
            { label: 'H-Bond Acceptors', value: props.hba, max: 10, unit: '', color: '#ffd93d' },
            { label: 'TPSA', value: props.tpsa, max: 140, unit: 'Å²', color: '#6bceff' },
            { label: 'Rotatable Bonds', value: props.rotatable_bonds, max: 10, unit: '', color: '#c084fc' },
            { label: 'Synth. Accessibility', value: props.synthetic_accessibility, max: 10, unit: '', color: '#fb923c' },
        ];

        this.propertiesDashboard.innerHTML = gauges.map(g => {
            const val = parseFloat(g.value) || 0;
            const pct = Math.min(100, Math.max(0, (val / g.max) * 100));
            return `
                <div class="property-gauge">
                    <div class="gauge-label">
                        <span>${g.label}</span>
                        <span style="color:${g.color};font-weight:600;">${g.value}${g.unit ? ' ' + g.unit : ''}</span>
                    </div>
                    <div class="gauge-bar">
                        <div class="gauge-fill" style="width:0%;background:${g.color};" data-target="${pct}%"></div>
                    </div>
                </div>
            `;
        }).join('');

        // Animate gauge fills
        requestAnimationFrame(() => {
            setTimeout(() => {
                document.querySelectorAll('.gauge-fill').forEach(fill => {
                    fill.style.width = fill.getAttribute('data-target');
                });
            }, 50);
        });
    }

    // ─── Render Patent Report ────────────────────────────
    renderPatentReport(report) {
        this.patentContent.textContent = report || 'No patent data available.';
    }

    // ─── Loading State ───────────────────────────────────
    showLoading() {
        this.loadingContainer.classList.add('active');
        this.resultsContainer.classList.remove('active');
    }

    hideLoading() {
        this.loadingContainer.classList.remove('active');
    }

    // ─── Error Display ───────────────────────────────────
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position:fixed;top:2rem;right:2rem;z-index:9999;
            background:rgba(255,50,50,0.9);color:white;padding:1rem 2rem;
            border-radius:12px;font-size:1rem;backdrop-filter:blur(10px);
            animation:fadeInOut 4s ease forwards;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 4000);
    }
}

window.app = new RekaApp();
