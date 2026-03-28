// The Entity class for the COBBLE engine
export class Entity {
    constructor(attrs = {}) {
        try {
            THREE; // If THREE is not defined, this will throw an error
        } catch (e) {
            console.error("THREE.js is not loaded. Please include it before using the Entity class.");
        }

        this.name = attrs.name || "Entity";
        this.position = attrs.position || { x: 0, y: 0, z: 0 };
        this.velocity = attrs.velocity || { x: 0, y: 0, z: 0 };
        this.rotation = attrs.rotation || { x: 0, y: 0, z: 0 };
        this.scale = attrs.scale || { x: 1, y: 1, z: 1 };
        this.mesh = null; // Placeholder for the THREE.js mesh associated with this entity

        // If a mesh type is provided, create the corresponding THREE.js mesh
        if (attrs.mesh) {

            let geometry;
            switch (attrs.mesh.toLowerCase()) {
                case "cube":
                    geometry = new THREE.BoxGeometry(1, 1, 1);
                    break;
                case "sphere":
                    geometry = new THREE.SphereGeometry(0.5, 32, 32);
                    break;
                // Add more shapes as needed
                default:
                    console.error(`Custom meshes are not supported yet. Please use a predefined mesh type like "Cube" or "Sphere".`);
                    return;
            }

            const material = new THREE.MeshStandardMaterial({ color: attrs.color || 0xFFFFFF });
            this.mesh = new THREE.Mesh(geometry, material);
            this.mesh.position.set(this.position.x, this.position.y, this.position.z);
            this.mesh.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z);
            this.mesh.scale.set(this.scale.x, this.scale.y, this.scale.z);
        }

        this.update = function() {
            // Update position based on velocity
            this.position.x += this.velocity.x;
            this.position.y += this.velocity.y;
            this.position.z += this.velocity.z;

            // Update the mesh position if it exists
            if (this.mesh) {
                this.mesh.position.set(this.position.x, this.position.y, this.position.z);
                this.mesh.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z);
                this.mesh.scale.set(this.scale.x, this.scale.y, this.scale.z);
            }
        };
    }
}