// The script that initializes the COBBLE engine.
import {Engine} from './COBBLE/main.js';
import {Entity} from './COBBLE/plugins/entity.js';
import {Light} from './COBBLE/plugins/light.js';

const engine = new Engine();
const player = new Entity({
    name: "Player",
    mesh: "Cube",
    color: 0xFF0000, // Red color
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 5, y: 2, z: 5 },
    velocity: { x: 0, y: 0, z: 0 }, // Move to the right
});
const ambientLight = new Light({
    name: "Ambient Light",
    type: "ambient",
    color: 0xFFFFFF, // White color
    intensity: 0.05,
});
const spotLight = new Light({
    name: "Spot Light",
    type: "spot",
    color: 0xFFFFFF, // White color
    intensity: 0.8,
    position: { x: 0, y: 5, z: 0 }, // Position of the light
});

engine.addEntity(player);
engine.addEntity(ambientLight);
engine.addEntity(spotLight);

engine.start();