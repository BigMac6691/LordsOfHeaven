class RNG
{
    constructor(seed)
    {
        this.seed = seed;
    }

    next()
    {
        let r = Math.sin(this.seed++) * 10000;

        return r - Math.floor(r);
    }
}

export {RNG};