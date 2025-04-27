class Ping
{
    constructor(stars)
    {
        this.stars = stars;
    }

    // given a starting point create an array of arrays of stars where the outer array index is the number 
    // of jumps to get to the stars in the inner array of stars.
    ping(start, depth)
    {
        const timerkey = `ping ${start}, ${depth}`;
        console.time(timerkey);

        if(!this.stars.has(start))
        {
            console.warn(`Star ${start} not found, map has ${this.stars ? this.stars.size : 0} stars!`);
            return;
        }

        const result = [[start]];
        const visited = new Set();

        visited.add(start);

        for(let i = 0; i < depth; i++)
        {
            const nextRing = [];

            result[i].forEach(starId => 
            {
                const star = this.stars.get(starId);

                star.wormholes.forEach(hole => 
                {
                    const otherStar = hole.getTarget(star.id);

                    if(!visited.has(otherStar.id))
                    {
                        nextRing.push(otherStar.id);

                        visited.add(otherStar.id);
                    }
                });
            });

            if(nextRing.length === 0)
                break; // end depth loop

            result.push(nextRing);
        }

        console.timeEnd(timerkey);

        return result;
    }

    // in the case where the player's stars are in separate groups it will return them all as a single set not as separate sets (that may overlap)
    // it returns two sets of stars; those owned by the player that have adjacent stars that are not owned in one set and all those unowned stars in another set
    borders(playerId)
    {
        console.time(`${playerId}'s borders`);

        const owned = new Set();
        const unowned = new Set();
        
        this.stars.values().forEach(star => 
        {
            if(star?.government?.controller?.id === playerId)
            {
                star.wormholes.forEach(hole => 
                {
                    const target = hole.getTarget(star.id);

                    if(target?.government?.controller?.id !== playerId)
                    {
                        owned.add(star);
                        unowned.add(target);
                    }
                });
            }
        });

        console.timeEnd(`${playerId}'s borders`);

        return [owned, unowned];
    }
}

export {Ping};