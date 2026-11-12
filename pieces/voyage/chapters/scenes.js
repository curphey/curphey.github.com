// The model for each scene, by id. Adding a scene means one line here and one in index.mjs; nothing else.
import { createFoundersScene } from './founders-scene.js';
import { createPierScene } from './pier-scene.js';
import { createTrinidadScene } from './trinidad-scene.js';
import { createBridgeScene } from './bridge-scene.js';
import { createNeedleScene } from './needle-scene.js';
import { createMontereyScene } from './monterey-scene.js';
import { createSausalitoScene } from './sausalito-scene.js';

export const scenes = { trinidad: createTrinidadScene, founders: createFoundersScene, pier: createPierScene, bridge: createBridgeScene, needle: createNeedleScene, monterey: createMontereyScene, return: createSausalitoScene, departure: createPierScene };
