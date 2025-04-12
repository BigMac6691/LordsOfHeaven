class Wormhole
{
    // distance is optional
    constructor(id, star0, star1, distance)
    {
        this.id = id;
        this.star0 = star0;
        this.star1 = star1;

        // these points are the actual world coordinates for the wormholes end points, not the center of the stars
        this.point0 = null;
        this.point1 = null;

        this.distance = distance ? distance : this.star0.position.distanceTo(this.star1.position);

        star0.wormholes.push(this);
        star1.wormholes.push(this);
    }

    // returns star object from other end of wormhole
    getTarget(fromStarId)
    {
        if(this.star0.id !== fromStarId && this.star1.id !== fromStarId)
            throw new Error(`Invalid star id ${fromStarId}`);

        return this.star0.id === fromStarId ? this.star1 : this.star0;
    }
}

export {Wormhole};