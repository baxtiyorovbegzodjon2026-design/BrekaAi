class MoleculeViewer {
    constructor() {
        this.viewer = null;
        this.containerId = null;
        this.isSpinning = true;
    }

    init(containerId) {
        this.containerId = containerId;
        let element = document.getElementById(containerId);
        if(!element) return;
        
        let config = { backgroundColor: '#0a0e27' };
        this.viewer = $3Dmol.createViewer(element, config);
    }

    loadMolecule(molData, format = 'sdf') {
        if (!this.viewer) return;
        
        this.viewer.clear();
        this.viewer.addModel(molData, format);
        this.setStyle('stick');
        this.viewer.zoomTo();
        this.viewer.render();
        
        if (this.isSpinning) {
            this.spin(true);
        }
    }

    setStyle(style) {
        if (!this.viewer) return;
        if (style === 'stick') {
            this.viewer.setStyle({}, {stick: {radius: 0.15}, sphere: {radius: 0.3}});
        } else if (style === 'sphere') {
            this.viewer.setStyle({}, {sphere: {}});
        } else if (style === 'cartoon') {
            this.viewer.setStyle({}, {cartoon: {}});
        }
        this.viewer.render();
    }

    highlight(atoms) {
        // Mock highlight functionality
    }

    spin(enabled) {
        this.isSpinning = enabled;
        if(this.viewer) {
            this.viewer.spin(this.isSpinning);
        }
    }

    reset() {
        if(this.viewer) {
            this.viewer.zoomTo();
        }
    }
}

window.moleculeViewer = new MoleculeViewer();
