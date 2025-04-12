class Player
{
    constructor(name, colour)
    {
        this.id = name;
        this.name = name;
        this.colour = colour;

        this.type = "human"; // human or an named ai
        
        this.fleetCounter = 0;
        this.techBase = 1;
        this.bank = 0;
    }
}

export {Player};