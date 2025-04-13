import { AIManager } from "../ai/AIManager.js";

class Player
{
    constructor(name, colour, ai = null)
    {
        this.id = name;
        this.name = name;
        this.colour = colour;

        this.ai = ai ? AIManager.createAI(ai, [this]) : null; // null or an instance of an AI
        
        this.fleetCounter = 0;
        this.techBase = 1;
        this.bank = 0;
    }
}

export {Player};