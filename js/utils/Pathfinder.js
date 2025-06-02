// This version is not a generalized path finder, it is tailored for star-wormhole navigation
class Pathfinder
{
    constructor(map)
    {
        this.map = map;

        // once given the map it may be a good idea to create the graph
        // the reason is that the current wormhole model has no direction rather it has both end points
        // so to know which star is on the other end of the wormhole always involves a calculation
        // node is current star, each edge leads to a star, the node has a cost mapping to go from one edge to another
    }

    findPath(source, target, safe, variance)
    {
        const timerkey = `${source}-${target} safe:${safe} variance:${variance}`;
        console.time(timerkey);

        const visited = new Set();
        const moves = []; // sorted by cost
        const results = [];

        moves.push({path: [source], cost: 0, from: null});

        /*
        so you need to consider all possible paths
        first you place possible moves on a list that is sorted according to the cost of making the move
        do not add moves to locations already visited, because you are always taking the lowest cost move that location should already have a lowest cost path
        visit the lowest cost move, mark it as visited, add the move to the path then add all new unvisited locations reachable from this new location to the queue
        continue until destination is reached
        ? the variance is used to allow multiple paths that are similar in cost, include all paths that < shortest path cost times variance

        works but no safe path or variance implemented nor is there a test for no path
        no path might be detectable if there are no more available moves
        */

        while(moves.length > 0)
        {
            const move = moves.shift(); // this should return the shortest existing path
            const head = move.path[move.path.length - 1];

            visited.add(head);

            if(head === target)
            {
                // console.log("path found", move);

                results.push(move);

                // need to decide if we are breaking or not
                break;
            }

            const node = this.map.get(head); // head is the id of the object being visited, node is the object

            for(const hole of node.wormholes)
            {
                const destination = hole.getTarget(head);

                // may want to mark unsafe locations as visited if the safe flag is true
                // safe meaning controlled by the player

                if(visited.has(destination.id))
                    continue;

                let cost = move.from ? +node.wormholeCosts.get(`${move.from}.${hole.id}`) : 0;

                const m = {path: [...move.path, destination.id], cost: move.cost + cost, from: hole.id};

                let i = 0;
                while(i < moves.length && moves[i].cost < m.cost)
                    i++;

                moves.splice(i, 0, m);
            }
        } // while !done

        // console.log("final list of paths", results);
        console.timeEnd(timerkey);

        return results;
    }
}

export {Pathfinder};