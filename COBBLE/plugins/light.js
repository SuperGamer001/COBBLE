// The Light class for the COBBLE engine
export class Light {
    constructor(attrs = {}) {
        try {
            THREE; // If THREE is not defined, this will throw an error
        } catch (e) {
            console.error("THREE.js is not loaded. Please include it before using the Light class.");
        }

        this.name = attrs.name || "Light";
        this.type = attrs.type || "ambient";
        this.color = attrs.color || 0xffffff;
        this.intensity = attrs.intensity || 1;
        this.position = attrs.position || { x: 0, y: 0, z: 0 };
        this.mesh = null; // Placeholder for the THREE.js light object associated with this entity

        switch (this.type.toLowerCase()) {
            case "ambient":
                this.mesh = new THREE.AmbientLight(this.color, this.intensity);
                break;
            case "directional":
                this.mesh = new THREE.DirectionalLight(this.color, this.intensity);
                this.mesh.position.set(this.position.x, this.position.y, this.position.z);
                break;
            case "point":
                this.mesh = new THREE.PointLight(this.color, this.intensity);
                this.mesh.position.set(this.position.x, this.position.y, this.position.z);
                break;
            case "spot":
                this.mesh = new THREE.SpotLight(this.color, this.intensity);
                this.mesh.position.set(this.position.x, this.position.y, this.position.z);
                break;
            default:
                console.error(`Unsupported light type "${this.type}". Please use "ambient", "directional", "point", or "spot".`);
                return;
        }

        this.update = function() {
            // For directional, point, and spot lights, update the position if it changes
            if (this.mesh instanceof THREE.DirectionalLight || this.mesh instanceof THREE.PointLight || this.mesh instanceof THREE.SpotLight) {
                this.mesh.position.set(this.position.x, this.position.y, this.position.z);
            }
        }
    }
}