class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    on(eventName, handler) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, new Set());
        }

        this.listeners.get(eventName).add(handler);

        return () => this.off(eventName, handler);
    }

    off(eventName, handler) {
        const handlers = this.listeners.get(eventName);
        if (!handlers) {
            return;
        }

        handlers.delete(handler);
        if (handlers.size === 0) {
            this.listeners.delete(eventName);
        }
    }

    emit(eventName, payload) {
        const handlers = this.listeners.get(eventName);
        if (!handlers) {
            return;
        }

        for (const handler of handlers) {
            handler(payload);
        }
    }
}

export class Engine {
    constructor(config = {}) {
        if (typeof globalThis.THREE === "undefined") {
            throw new Error("THREE.js is not loaded. Please include it before using the Engine.");
        }

        console.info("THREE.js has been found! Initializing COBBLE.js Engine...");

        this.entities = [];
        this.plugins = new Map();
        this.systems = new Map();
        this.isRunning = false;
        this.animationFrameId = null;
        this.lastFrameTime = 0;
        this.speed = Number.isFinite(config.speed) ? config.speed : 1;
        this.renderScale = Number.isFinite(config.renderScale) ? config.renderScale : 1;
        this.lastCanvasMetrics = {
            cssWidth: 0,
            cssHeight: 0,
            scale: this.renderScale,
            devicePixelRatio: window.devicePixelRatio || 1,
        };

        this.events = new EventBus();

        // Load the default CSS for the engine once.
        const existingStyle = document.querySelector('link[data-cobble-style="default"]');
        if (!existingStyle) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "./COBBLE/lib/css/default.css";
            link.dataset.cobbleStyle = "default";
            document.head.appendChild(link);
        }

        // Create the scene, camera, and renderer.
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, 16 / 9, 0.1, 1000);
        this.camera.position.z = 5;

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        document.body.appendChild(this.renderer.domElement);

        this.context = {
            engine: this,
            scene: this.scene,
            camera: this.camera,
            renderer: this.renderer,
            emit: (eventName, payload) => this.emit(eventName, payload),
            on: (eventName, handler) => this.on(eventName, handler),
            off: (eventName, handler) => this.off(eventName, handler),
            getTime: () => this.lastFrameTime,
            getEntities: () => [...this.entities],
        };

        // Bind the resize handler and call it once to set the initial size.
        this.boundResize = this.resize.bind(this);
        window.addEventListener("resize", this.boundResize);
        this.resize();

        // A second pass catches CSS/layout that settles right after startup.
        requestAnimationFrame(() => this.ensureRendererResolution());
    }

    clampRenderScale(value) {
        if (!Number.isFinite(value) || value <= 0) {
            console.warn("Render scale must be greater than 0. Falling back to 1.");
            return 1;
        }

        if (value > 8) {
            console.warn("Render scale is too high and may cause performance issues. Clamping to 8.");
            return 8;
        }

        return value;
    }

    setRenderScale(value) {
        this.renderScale = this.clampRenderScale(value);
        this.resize();
    }

    getCanvasCssSize() {
        const canvas = this.renderer.domElement;
        return {
            width: canvas.clientWidth || window.innerWidth,
            height: canvas.clientHeight || window.innerHeight,
        };
    }

    resize() {
        const { width: cssWidth, height: cssHeight } = this.getCanvasCssSize();
        const safeScale = this.clampRenderScale(this.renderScale);
        const devicePixelRatio = window.devicePixelRatio || 1;

        const width = Math.max(1, Math.floor(cssWidth * safeScale));
        const height = Math.max(1, Math.floor(cssHeight * safeScale));

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setPixelRatio(devicePixelRatio);
        this.renderer.setSize(width, height, false);

        this.lastCanvasMetrics = {
            cssWidth,
            cssHeight,
            scale: safeScale,
            devicePixelRatio,
        };

        this.emit("engine:resize", { width, height, scale: safeScale });
    }

    ensureRendererResolution() {
        const { width: cssWidth, height: cssHeight } = this.getCanvasCssSize();
        const safeScale = this.clampRenderScale(this.renderScale);
        const devicePixelRatio = window.devicePixelRatio || 1;
        const previous = this.lastCanvasMetrics;

        const changed =
            previous.cssWidth !== cssWidth ||
            previous.cssHeight !== cssHeight ||
            previous.scale !== safeScale ||
            previous.devicePixelRatio !== devicePixelRatio;

        if (changed) {
            this.resize();
        }
    }

    on(eventName, handler) {
        return this.events.on(eventName, handler);
    }

    off(eventName, handler) {
        this.events.off(eventName, handler);
    }

    emit(eventName, payload) {
        this.events.emit(eventName, payload);
    }

    use(plugin, options = {}) {
        if (!plugin || typeof plugin !== "object") {
            throw new Error("Plugins must be objects.");
        }

        if (!plugin.name) {
            throw new Error("Plugin is missing a name.");
        }

        if (this.plugins.has(plugin.name)) {
            console.warn(`Plugin \"${plugin.name}\" is already installed.`);
            return this;
        }

        const pluginApi = {
            extend: (name, value) => {
                if (name in this) {
                    throw new Error(`Engine already has a property named \"${name}\".`);
                }

                if (typeof value === "function") {
                    this[name] = (...args) => value(this.context, ...args);
                    return;
                }

                this[name] = value;
            },
            registerSystem: (name, system) => {
                if (!name || typeof name !== "string") {
                    throw new Error("System name must be a non-empty string.");
                }

                if (this.systems.has(name)) {
                    throw new Error(`System \"${name}\" is already registered.`);
                }

                this.systems.set(name, system || {});
            },
            removeSystem: (name) => {
                this.systems.delete(name);
            },
            addEntity: (entity) => this.addEntity(entity),
            removeEntity: (entity) => this.removeEntity(entity),
            on: (eventName, handler) => this.on(eventName, handler),
            off: (eventName, handler) => this.off(eventName, handler),
            emit: (eventName, payload) => this.emit(eventName, payload),
        };

        const lifecycle = typeof plugin.install === "function"
            ? plugin.install(this.context, options, pluginApi) || {}
            : {};

        const record = {
            ...plugin,
            ...lifecycle,
            options,
        };

        this.plugins.set(plugin.name, record);
        this.emit("plugin:registered", { name: plugin.name, plugin: record });

        if (this.isRunning && typeof record.onStart === "function") {
            record.onStart(this.context);
        }

        return this;
    }

    removePlugin(name) {
        const plugin = this.plugins.get(name);
        if (!plugin) {
            return false;
        }

        if (typeof plugin.onStop === "function") {
            plugin.onStop(this.context);
        }

        if (typeof plugin.dispose === "function") {
            plugin.dispose(this.context);
        }

        this.plugins.delete(name);
        this.emit("plugin:removed", { name });
        return true;
    }

    addEntity(entity) {
        if (!entity || typeof entity !== "object") {
            throw new Error("Entity must be an object.");
        }

        this.entities.push(entity);

        if (entity.mesh) {
            this.scene.add(entity.mesh);
        }

        this.emit("entity:added", { entity });
        return entity;
    }

    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index === -1) {
            return false;
        }

        this.entities.splice(index, 1);
        if (entity.mesh) {
            this.scene.remove(entity.mesh);
        }

        this.emit("entity:removed", { entity });
        return true;
    }

    update(deltaTime) {
        for (const system of this.systems.values()) {
            if (system && typeof system.update === "function") {
                system.update(deltaTime, this.context);
            }
        }

        for (const plugin of this.plugins.values()) {
            if (plugin && typeof plugin.onUpdate === "function") {
                plugin.onUpdate(deltaTime, this.context);
            }
        }
    }

    animate(timestamp = performance.now()) {
        if (!this.isRunning) {
            return;
        }

        this.ensureRendererResolution();

        const deltaSeconds = ((timestamp - this.lastFrameTime) / 1000) * this.speed;
        this.lastFrameTime = timestamp;

        this.update(deltaSeconds);
        this.emit("engine:update", { deltaTime: deltaSeconds, time: timestamp });
        this.renderer.render(this.scene, this.camera);

        this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
    }

    start() {
        if (this.isRunning) {
            return;
        }

        this.isRunning = true;
        this.lastFrameTime = performance.now();
        this.ensureRendererResolution();

        for (const system of this.systems.values()) {
            if (system && typeof system.start === "function") {
                system.start(this.context);
            }
        }

        for (const plugin of this.plugins.values()) {
            if (plugin && typeof plugin.onStart === "function") {
                plugin.onStart(this.context);
            }
        }

        this.emit("engine:start", { time: this.lastFrameTime });
        this.animate(this.lastFrameTime);
    }

    stop() {
        if (!this.isRunning) {
            return;
        }

        this.isRunning = false;

        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        for (const system of this.systems.values()) {
            if (system && typeof system.stop === "function") {
                system.stop(this.context);
            }
        }

        for (const plugin of this.plugins.values()) {
            if (plugin && typeof plugin.onStop === "function") {
                plugin.onStop(this.context);
            }
        }

        this.emit("engine:stop", { time: performance.now() });
    }

    destroy() {
        this.stop();

        for (const plugin of this.plugins.values()) {
            if (plugin && typeof plugin.dispose === "function") {
                plugin.dispose(this.context);
            }
        }

        for (const entity of this.entities) {
            if (entity.mesh) {
                this.scene.remove(entity.mesh);
            }
        }

        this.entities.length = 0;
        this.plugins.clear();
        this.systems.clear();
        window.removeEventListener("resize", this.boundResize);
    }
}

export default Engine;