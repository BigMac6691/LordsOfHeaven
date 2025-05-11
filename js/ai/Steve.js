import { Fleets } from "../control/Fleets.js";
import { Orders } from "../control/Orders.js";

import { AI } from "./AI.js";

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
class Steve extends AI
{
    constructor(player)
    {
        super();

        this.player = player;

        this.attackThreshold = 3;
        this.defenceThreshold = 0.75;

        // sum of the next three should be 1
        this.researchThreshold = 0.2;
        this.industryThreshold = 0.2;
        this.shipThreshold = 0.6;

        console.log(`${player.name} will be using the Steve AI`);
    }

    playTurn()
    {
        console.group(`playing turn ${window.game.turn} with Steve AI`);

        const borders = window.game.ping.borders(this.player.id);

        console.log(`${this.player.name}'s current borders are:`, borders);

        // analyze borders
        const analysisFriendly = this.analyzeFriendly(borders[AI.OWNED]);
        const analysisEnemy = this.analyzeEnemy(borders[AI.UNOWNED], analysisFriendly);
      
        let ndex = 0;
        while(ndex < analysisEnemy.length)
        {
            const analysis = analysisEnemy[ndex++];

            if(analysis.ratio < this.attackThreshold)
                continue;

            if(analysis.enemyShips === 0)
            {
                const source = analysis.friendlyStars[0];

                if(analysisFriendly.get(source.id).excess < 1) // check for available ships
                    continue;

                const key = `${this.player.id}.${source.id}.${analysis.star.id}`;

                analysisFriendly.get(source.id).excess -= 1;

                Orders.set("move", key, {player: this.player.id, source: source.id, target: analysis.star.id, amount: 1});
            }

            // gather excess ships from all friendly stars adjacent to the target until attack threshold is reached
            // only take ships in excess of defence threshold
            // if gathered ships reach attack threshold then issue attack order and stop taking more ships from other adjacent stars
            // special case the target is neutral - just send 1 ship

            // ?? what if two stars are adjacent and say one is on a low value branch but the other is on a high value branch where should you take from?
            // I'd say low value first, that is from the friendly star that is on a low value branch.
        }

        // move any friendly border ships that remain
        for(const analysis of analysisFriendly.values())
        {
            console.log("analysisOwned", analysis);

            let excess = analysis.excess;

            analysis.enemyStars.forEach(enemyStar => 
            {
                let move = Math.floor(excess * enemyStar.economy.industry / analysis.enemyEconomySum);

                if(move > 0)
                {
                    console.log(analysis.star.id, enemyStar.id, move, excess, enemyStar.economy.industry, analysis.enemyEconomySum)

                    analysis.excess - move;

                    const key = `${this.player.id}.${analysis.star.id}.${enemyStar.id}`;

                    if(Orders.MOVES.has(key))
                        Orders.MOVES.get(key).amount += move;
                    else
                        Orders.set("move", key, {player: this.player.id, source: analysis.star.id, target: enemyStar.id, amount: move});
                }
            });
        };

        this.determineSpending();

        console.groupEnd();

        window.game.nextPlayer();
    }

    // returns a map
    analyzeFriendly(borders)
    {
        const analysis = new Map();
        
        borders.forEach(friendlyStar => 
        {
            let enemyShips = 0;
            let enemyStars = [];
            let enemyEconomySum = 0;

            const friendlyShips = Fleets.getPlayersFleetsAt(this.player, friendlyStar.id).reduce((sum, fleet) => sum + fleet.ships, 0);
            
            friendlyStar.wormholes.forEach(hole => 
            {
                const enemyTarget = hole.getTarget(friendlyStar.id);

                if(enemyTarget?.government?.controller?.id !== this.player.id)
                {
                    enemyShips += Fleets.getFleetsAt(enemyTarget.id).reduce((sum, fleet) => sum + fleet.ships, 0);
                    enemyStars.push(enemyTarget);
                    enemyEconomySum += enemyTarget.economy.industry;
                }
            });

            const ratio = enemyShips ? friendlyShips / enemyShips : Infinity;
            const excess = Math.max(Math.floor(friendlyShips - enemyShips * this.defenceThreshold), 0);

            analysis.set(friendlyStar.id, {star: friendlyStar, friendlyShips, enemyShips, enemyStars, ratio, excess, enemyEconomySum});
        });

        console.log("analysisOwned map", analysis);

        return analysis;
    }

    // returns a sorted array with highest risk/value at front
    analyzeEnemy(borders, friends)
    {
        const analysis = [];

        borders.forEach(star => 
        {
            let enemyCount = 0;
            let friendlyShips = 0;
            
            const enemyShips = Fleets.getFleetsAt(star.id).reduce((sum, fleet) => sum + fleet.ships, 0);
            const friendlyStars = [];
            
            star.wormholes.forEach(hole => 
            {
                const target = hole.getTarget(star.id);

                if(target?.government?.controller?.id === this.player.id)
                {
                    friendlyShips += friends.get(target.id).excess;
                    friendlyStars.push(target);
                }
                else
                    enemyCount++;
            });

            const ratio = enemyShips ? friendlyShips / enemyShips : Infinity;

            analysis.push({star, friendlyShips, enemyShips, ratio, enemyCount, friendlyStars});
        });

        analysis.sort((a, b) => a.ratio === b.ratio ? b.star.economy.industry - a.star.economy.industry : a.ratio - b.ratio);

        console.log("analysisUnowned", analysis);

        return analysis;
    }

    moveInterior()
    {
        const starMap = window.game.modelFactory.stars;
        const maxIndustry = Math.max(...[...starMap.values()].map(star => star.economy.industry));

        console.log("maxIndustry", maxIndustry);

        for(const star of starMap.values())
        {
            if(star?.government?.controller?.id !== this.player.id)
                continue;
        }
    }

    determineSpending()
    {
        const starMap = [...window.game.modelFactory.stars.values()].filter(star => star?.government?.controller?.id === this.player.id);

        console.log("starMap", starMap);

        const maxIndustry = Math.max(...starMap.map(star => star.economy.industry));

        console.log("maxIndustry", maxIndustry);

        for(const star of starMap)
        {
            if(star?.government?.controller?.id !== this.player.id)
                continue;

            const industry = +star.economy.industry;

            if(industry < maxIndustry / 2)
            {
                const key = `${this.player.id}.${star.id}.industry`;

                Orders.set("build", key, {player: this.player.id, source: star.id, type: "industry", amount: industry});
            }
            else
            {
                let key = `${this.player.id}.research`;
                
                if(Orders.RESEARCH.has(key))
                    Orders.RESEARCH.get(key).value += industry;
                else
                    Orders.set("research", key, {player: this.player.id, type: "research", amount: this.researchThreshold * industry});

                key = `${this.player.id}.${star.id}.industry`;
                Orders.set("build", key, {player: this.player.id, source: star.id, type: "industry", amount: this.industryThreshold * industry});

                key = `${this.player.id}.${star.id}.ships`;
                Orders.set("build", key, {player: this.player.id, source: star.id, type: "ships", amount: this.shipThreshold * industry});
            }

            console.log(Orders.RESEARCH, Orders.BUILD);
        };
    }
}

export {Steve};