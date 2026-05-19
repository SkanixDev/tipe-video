import { SimulationEngine } from "./engine.js";

const simulation = new SimulationEngine();

simulation.scheduleEvent(2, "PACKET_ARRIVAL", {});

simulation.run();
