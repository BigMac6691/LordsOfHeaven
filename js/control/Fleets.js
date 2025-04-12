import { Fleet } from "../models/Fleet.js";

class Fleets
{
    static FLEETS = new Map(); // <String, Fleet> which is <fleetid, fleet>

    static addFleet(fleet)
    {
        if(fleet.ships === 0)
            throw new Error("Empty fleets are not allowed!");

        this.FLEETS.set(fleet.id, fleet);
    }

    // this method is used to decide if the fleet icon is displayed or not
    static hasFleetsAt(location)
    {
        for(let fleet of this.FLEETS.values())
            if(fleet.location === location)
                return true;

        return false;
    }

    static getFleetsAt(location)
    {
        let fleets = [];

        for(let fleet of this.FLEETS.values())
            if(fleet.location === location)
                fleets.push(fleet);

        return fleets;
    }

    static getPlayersFleets(player)
    {
        let fleets = [];

        for(let fleet of this.FLEETS.values())
            if(fleet.commander.id === player.id)
                fleets.push(fleet);

        return fleets;
    }

    static getPlayersFleetsAt(player, location)
    {
        let fleets = [];

        for(let fleet of this.FLEETS.values())
            if(fleet.commander.id === player.id && fleet.location === location)
                fleets.push(fleet);
        
        return fleets;
    }

    static mergeFleets(player, location)
    {
        const fleets = this.getPlayersFleetsAt(player, location);

        if(fleets.length === 0)
            return null;
        else if(fleets.length === 1)
            return fleets[0];

        const merge = new Fleet(player, location, 0);

        fleets.forEach(fleet => 
        {
            merge.ships += fleet.ships;

            Fleets.removeFleet(fleet);
        });

        Fleets.addFleet(merge);

        return merge;
    }

    static removeFleet(fleet)
    {
        this.FLEETS.delete(fleet.id);
    }
}

export {Fleets};