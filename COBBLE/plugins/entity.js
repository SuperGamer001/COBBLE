// Entity plugin and class for COBBLE
export class Entity {
    constructor(attrs = {}, meshFactoryRegistry = new Map()) {
        if (typeof globalThis.THREE === "undefined") {
            throw new Error("THREE.js is not loaded. Please include it before using the Entity class.");
        }

        this.name = attrs.name || "Entity";
        this.position = attrs.position || { x: 0, y: 0, z: 0 };
        this.velocity = attrs.velocity || { x: 0, y: 0, z: 0 };
        this.rotation = attrs.rotation || { x: 0, y: 0, z: 0 };
        this.scale = attrs.scale || { x: 1, y: 1, z: 1 };
        this.mesh = null;

        if (attrs.mesh) {
            const meshType = String(attrs.mesh).toLowerCase();
            const meshFactory = meshFactoryRegistry.get(meshType);

            if (!meshFactory) {
                throw new Error(`Unsupported mesh type \"${attrs.mesh}\".`);
            }

            this.mesh = meshFactory(attrs);
            this.syncTransform();
        }
    }

    syncTransform() {
        if (!this.mesh) {
            return;
        }

        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.mesh.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z);
        this.mesh.scale.set(this.scale.x, this.scale.y, this.scale.z);
    }

    update(deltaTime = 0) {
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
        this.position.z += this.velocity.z * deltaTime;
        this.syncTransform();
    }
}

export const EntityPlugin = {
    name: "entity",
    version: "1.0.0",
    install(context, options = {}, api) {
        const meshFactories = new Map();

        const registerDefaults = options.registerDefaults !== false;
        if (registerDefaults) {
            meshFactories.set("cube", (attrs = {}) => {
                const geometry = new THREE.BoxGeometry(1, 1, 1);
                const material = new THREE.MeshStandardMaterial({ color: attrs.color || 0xFFFFFF });
                return new THREE.Mesh(geometry, material);
            });

            meshFactories.set("sphere", (attrs = {}) => {
                const geometry = new THREE.SphereGeometry(0.5, 32, 32);
                const material = new THREE.MeshStandardMaterial({ color: attrs.color || 0xFFFFFF });
                return new THREE.Mesh(geometry, material);
            });
        }

        api.extend("registerMeshType", (_ctx, name, factory) => {
            if (!name || typeof name !== "string") {
                throw new Error("Mesh name must be a non-empty string.");
            }

            if (typeof factory !== "function") {
                throw new Error("Mesh factory must be a function.");
            }

            meshFactories.set(name.toLowerCase(), factory);
            context.emit("entity:meshTypeRegistered", { name: name.toLowerCase() });
        });

        api.extend("entity", (_ctx, attrs = {}) => {
            const entity = new Entity(attrs, meshFactories);
            api.addEntity(entity);
            return entity;
        });

        api.registerSystem("entity:update", {
            update(deltaTime) {
                const entities = context.getEntities();
                for (const entry of entities) {
                    if (entry && typeof entry.update === "function") {
                        entry.update(deltaTime, context);
                    }
                }
            },
        });

        return {
            onStart() {
                context.emit("plugin:entity:ready", {
                    defaultMeshTypes: [...meshFactories.keys()],
                });
            },
        };
    },
};

export default EntityPlugin;