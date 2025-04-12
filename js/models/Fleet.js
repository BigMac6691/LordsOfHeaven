class Fleet
{
    constructor(commander, location, ships)
    {
        this.id = `${commander.id}.${commander.fleetCounter++}`;

        this.commander = commander; // this is the player
        this.location = location;
        this.ships = ships;
    }
}

export {Fleet};