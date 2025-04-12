class Star
{
    constructor(id, name, position, sector)
    {
        this.id = id;
        this.name = name;
        this.position = position;
        this.sector = sector;

        this.wormholes = [];
        this.wormholeCosts = new Map();

        this.economy = null;
        this.government = null;
    }
}

export {Star};