import { Fleets } from "../control/Fleets.js";

// Smart AI
// core features include
// assess risk at each part of the unowned border
// assess value of each part of the unowned border
// determine build orders
// determine move orders
// determine attack points
// determine points of defense
// ? determine where choke points are
// ? be aware of the map in depth with or without fog of war
class Steve
{
    constructor(player)
    {
        this.player = player;

        this.attackThreshold = 3;
        this.defenceThreshold = 0.75;

        console.log(`${player.name} will be using the Steve AI`);
    }

    playTurn()
    {
        console.group("playing turn with Steve AI");

        const borders = window.game.ping.borders(this.player.id);

        console.log(`${this.player.name}'s current borders are:`, borders);

        // analyze friendly borders
        const analysisOwned = new Map();
        
        borders[0].forEach(star => 
        {
            const friendlyShips = Fleets.getPlayersFleetsAt(this.player, star.id).reduce((sum, fleet) => sum + fleet.ships, 0);
            let enemyShips = 0;

            star.wormholes.forEach(hole => 
            {
                const target = hole.getTarget(star.id);

                if(target?.government?.controller?.id !== this.player.id)
                    enemyShips += Fleets.getFleetsAt(target.id).reduce((sum, fleet) => sum + fleet.ships, 0);
            });

            const ratio = enemyShips ? friendlyShips / enemyShips : Infinity;
            const excess = Math.max(Math.floor(friendlyShips - enemyShips * this.defenceThreshold), 0);

            analysisOwned.set(star.id, {star, friendlyShips, enemyShips, ratio, excess});
        });

        console.log("analysisOwned", analysisOwned);

        // analyze enemy borders
        const analysisUnowned = [];

        borders[1].forEach(star => 
        {
            const enemyShips = Fleets.getFleetsAt(star.id).reduce((sum, fleet) => sum + fleet.ships, 0);
            let friendlyShips = 0;

            star.wormholes.forEach(hole => 
            {
                const target = hole.getTarget(star.id);

                if(target?.government?.controller?.id === this.player.id)
                    friendlyShips += Fleets.getPlayersFleetsAt(this.player, target.id).reduce((sum, fleet) => sum + fleet.ships, 0);
            });

            const ratio = enemyShips ? friendlyShips / enemyShips : Infinity;

            analysisUnowned.push({star, friendlyShips, enemyShips, ratio});
        });

        analysisUnowned.sort((a, b) => a.ratio === b.ratio ? b.star.economy.industry - a.star.economy.industry : a.ratio - b.ratio);

        console.log("analysisUnowned", analysisUnowned);

        let i = 0;
        while(i < analysisUnowned.length && analysisUnowned[i].ratio >= this.attackThreshold)
        {
            // gather ships from all friendly stars adjacent to the target until attack threshold is reached
            // only take ships in excess of defence threshold
            // if gathered ships reach attack threshold then issue attack order and stop taking more ships from other adjacent stars
            // special case the target is neutral - just send 1 ship

            // ?? what if two stars are adjacent and say one is on a low value branch but the other is on a high value branch where should you take from?
            // I'd say low value first, that is from the friendly star that is on a low value branch.

            i++;
        }

        console.groupEnd();
    }
}

export {Steve};