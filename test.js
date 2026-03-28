// The script that initializes the COBBLE engine.
import {Engine} from './COBBLE/main.js';
import {EntityPlugin} from './COBBLE/plugins/entity.js';
import {LightPlugin} from './COBBLE/plugins/light.js';

const engine = new Engine();

engine.use(EntityPlugin);
engine.use(LightPlugin);

engine.on('engine:start', () => {
    console.info('COBBLE engine started');
});

engine.on('entity:added', ({ entity }) => {
    console.info(`Entity added: ${entity.name}`);
});

const player = engine.entity({
    name: "Player",
    mesh: "Cube",
    color: 0xFF0000, // Red color
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 5, y: 2, z: 5 },
    velocity: { x: 0.4, y: 0, z: 0 }, // Move to the right
});

const ambientLight = engine.light({
    name: "Ambient Light",
    type: "ambient",
    color: 0xFFFFFF, // White color
    intensity: 0.2,
});

const spotLight = engine.light({
    name: "Spot Light",
    type: "spot",
    color: 0xFFFFFF, // White color
    intensity: 0.8,
    position: { x: 0, y: 5, z: 0 }, // Position of the light
});


engine.start();