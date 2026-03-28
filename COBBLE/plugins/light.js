// Light plugin and class for COBBLE
export class Light {
    constructor(attrs = {}) {
        if (typeof globalThis.THREE === "undefined") {
            throw new Error("THREE.js is not loaded. Please include it before using the Light class.");
        }

        this.name = attrs.name || "Light";
        this.type = attrs.type || "ambient";
        this.color = attrs.color || 0xFFFFFF;
        this.intensity = attrs.intensity || 1;
        this.position = attrs.position || { x: 0, y: 0, z: 0 };
        this.mesh = null;

        switch (this.type.toLowerCase()) {
            case "ambient":
                this.mesh = new THREE.AmbientLight(this.color, this.intensity);
                break;
            case "directional":
                this.mesh = new THREE.DirectionalLight(this.color, this.intensity);
                break;
            case "point":
                this.mesh = new THREE.PointLight(this.color, this.intensity);
                break;
            case "spot":
                this.mesh = new THREE.SpotLight(this.color, this.intensity);
                break;
            default:
                throw new Error(`Unsupported light type \"${this.type}\".`);
        }

        this.syncTransform();
    }

    syncTransform() {
        if (!this.mesh) {
            return;
        }

        if (
            this.mesh instanceof THREE.DirectionalLight ||
            this.mesh instanceof THREE.PointLight ||
            this.mesh instanceof THREE.SpotLight
        ) {
            this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        }
    }

    update() {
        this.syncTransform();
    }
}

export const LightPlugin = {
    name: "light",
    version: "1.0.0",
    install(context, _options, api) {
        api.extend("light", (_ctx, attrs = {}) => {
            const light = new Light(attrs);
            api.addEntity(light);
            context.emit("light:created", { light });
            return light;
        });

        return {
            onStart() {
                context.emit("plugin:light:ready", { types: ["ambient", "directional", "point", "spot"] });
            },
        };
    },
};

export default LightPlugin;