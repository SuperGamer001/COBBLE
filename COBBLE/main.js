// COBBLE.js - A simple 3D game engine built on top of THREE.js
export class Engine {
    constructor() {
        try {
            THREE; // If THREE is not defined, this will throw an error
        } catch (e) {
            console.error("THREE.js is not loaded. Please include it before using the Engine.");
            return;
        }
        
        console.info("THREE.js has been found! Initializing COBBLE.js Engine...");

        this.entities = [];
        this.isRunning = false;
        this.speed = 1; // Default speed is 1, which means normal speed. Lower values make the game run in slower motion, while higher values make it run faster.
        this.renderScale = 4; // Default resolution is 1, which means the game will render at the same resolution as the canvas size. Higher values will render at a higher resolution, while lower values will render at a lower resolution.

        // Load the default CSS for the engine
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = './COBBLE/lib/css/default.css';
        document.head.appendChild(link);

        // Create the scene, camera, and renderer
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, 16 / 9, 0.1, 1000);
        this.camera.position.z = 5;

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        document.body.appendChild(this.renderer.domElement);


        // Keep renderer resolution synced with CSS-controlled canvas size.
        this.resize = function() {

            if (this.renderScale <= 0) {
                console.warn("Resolution must be greater than 0. Resetting to default value of 1.");
                this.renderScale = 1;
            }
            else if (this.renderScale > 8) {
                console.warn("Resolution is too high and may cause performance issues. Resetting to maximum value of 8.");
                this.renderScale = 8;
            }

            const canvas = this.renderer.domElement;
            const width = (canvas.clientWidth || window.innerWidth) * this.renderScale;
            const height = (canvas.clientHeight || window.innerHeight) * this.renderScale;

            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setPixelRatio(window.devicePixelRatio || 1);
            this.renderer.setSize(width, height, false);
        };

        this.start = function() {
            this.isRunning = true;
            this.animate();
        }

        this.animate = function() {
            if (!this.isRunning) return;
            requestAnimationFrame(this.animate.bind(this));
            this.entities.forEach(entity => entity.update());
            this.resize(); // Ensure the renderer is always the correct size
            this.renderer.render(this.scene, this.camera);
        }

        this.addEntity = function(entity) {
            this.entities.push(entity);
            this.scene.add(entity.mesh);
        }
    }
}

export default Engine;