import {Star} from "./Star.js";
import {Wormhole} from "./Wormhole.js";
import { Economy } from "./Economy.js";
import { Government } from "./Government.js";

import { RNG } from "../utils/RNG.js";

import * as G3D from "three";

class ModelFactory extends EventTarget
{
    constructor(seed)    
    {    
        super();

        this.seed = seed;
        this.productionBase = 5;

        this.stars = new Map();
        this.wormholes = new Map();
    }

    notifyModelUpdate(detail)
    {
        this.dispatchEvent(new CustomEvent("updateView", {detail: detail}));
    }

    createStars(dimensions, density)
    {
        console.time("createStars()");

        const rng = new RNG(this.seed); 

        const range = density[1] - density[0];
        const xRange = 1000 / dimensions.x;
        const yRange = 1000 / dimensions.y;
        const zRange = dimensions.z === 1 ? 10 : 1000 / dimensions.z;
        const minDist = xRange / 25;

        console.log(`minDist=${minDist}`);

        const sectors = new Map();

        let count = 0;

        for(let x = 0; x < dimensions.x; x++)
            for(let y = 0; y < dimensions.y; y++)
                for(let z = 0; z < dimensions.z; z++)
                {
                    let breakCount = 0;

                    const sectorId = new DOMPoint(x, y, z);
                    const starCount = density[0] + rng.next() * range;
                    const sectorStars = [];

                    while(sectorStars.length < starCount)
                    {
                        const xp = (x + rng.next()) * xRange;
                        const yp = (y + rng.next()) * yRange;
                        const zp = (z + rng.next()) * zRange;

                        const v3 = new G3D.Vector3(xp, yp, zp);

                        if(!sectorStars.some(s => v3.distanceTo(s.position) < minDist))
                        {
                            const star = new Star(`STAR${count}`, `Star-${count}`, v3, sectorId);
                            star.economy = new Economy(rng.next() * this.productionBase);
                            star.government = new Government();

                            count++;
                            this.stars.set(star.id, star);
                            sectorStars.push(star);

                            this.dispatchEvent(new CustomEvent("createView", {detail: {model: "star", data: star}}));
                        }
                        else
                            console.log("Stars were too close...");

                        if(breakCount++ > 100)
                            throw new ErrorEvent(`Unable to create stars in sector with dimensions: ${dimensions} density: ${density}`);
                    }

                    sectors.set(`${sectorId.x},${sectorId.y},${sectorId.z}`, sectorStars);

                    this.connectStars(sectorStars);
                }
        
        this.connectSectors(sectors, dimensions);
        this.calculateWormholeDistances();

        console.timeEnd("createStars()");
    }

    calculateWormholeDistances()
    {
        console.time("calculateWormholeDistances()");

        for(const star of this.stars.values())
        {
            if(star.wormholes.length <= 1)
            {
                star.wormholeCosts.set(star.wormholes[0].id, 0);
                continue;
            }

            for(let i = 0; i < star.wormholes.length - 1; i++)
            {
                const wh0 = star.wormholes[i];
                const whPoint0 = star.position.distanceTo(wh0.point0) < star.position.distanceTo(wh0.point1) ? wh0.point0 : wh0.point1;

                for(let j = i + 1; j < star.wormholes.length; j++)
                {
                    const wh1 = star.wormholes[j];
                    const whPoint1 = star.position.distanceTo(wh1.point0) < star.position.distanceTo(wh1.point1) ? wh1.point0 : wh1.point1;
                    const distance = whPoint0.distanceTo(whPoint1);

                    star.wormholeCosts.set(`${wh0.id}.${wh1.id}`, distance);
                    star.wormholeCosts.set(`${wh1.id}.${wh0.id}`, distance);
                }
            }
        };

        console.timeEnd("calculateWormholeDistances()");
    }

    connectStars(stars)
    {
        console.log(`Start ModelFactory.connectStars: ${window.gameStart - Date.now()}`);

        const connected = new Set([stars[0]]);

        while(connected.size < stars.length)
        {
            let minDist = Infinity;
            let nearest = null;
            let from = null;

            connected.forEach(connectedStar =>
            {
                stars.forEach(star =>
                {
                    if(!connected.has(star))
                    {
                        const distance  = star.position.distanceTo(connectedStar.position);

                        if(distance < minDist)
                        {
                            minDist = distance;
                            nearest = star;
                            from = connectedStar;
                        }
                    }
                });
            });

            connected.add(nearest);

            const whid = `WH${this.wormholes.size}`;
            const wormhole = new Wormhole(whid, nearest, from, minDist);

            this.wormholes.set(whid, wormhole);

            this.dispatchEvent(new CustomEvent("createView", {detail: {model: "wormhole", data: wormhole}}));
        }// end while three is unconnected stars

        console.log(`End ModelFactory.connectStars: ${window.gameStart - Date.now()}`);
    }

    connectSectors(sectors, dimensions)
    {
        console.log(`Start ModelFactory.connectSectors: ${window.gameStart - Date.now()}`);

        sectors.forEach((fromSector, sectorId) => 
        {
            const id = sectorId.split(",");
            const xSectorId = +id[0] + 1;
            const ySectorId = +id[1] + 1;
            const zSectorId = +id[2] + 1;

            if(xSectorId < dimensions.x)
                this.connectSectorToSector(fromSector, sectors.get(`${xSectorId},${id[1]},${id[2]}`));

            if(ySectorId < dimensions.y)
                this.connectSectorToSector(fromSector, sectors.get(`${id[0]},${ySectorId},${id[2]}`));

            if(zSectorId < dimensions.z)
                this.connectSectorToSector(fromSector, sectors.get(`${id[0]},${id[1]},${zSectorId}`));
        });

        console.log(`End ModelFactory.connectSectors: ${window.gameStart - Date.now()}`);
    }

    connectSectorToSector(fromSector, toSector)
    {
        let minDist = Infinity;
        let from = null;
        let to = null;

        fromSector.forEach(fromStar => 
        {
            toSector.forEach(toStar => 
            {
                const distance = fromStar.position.distanceTo(toStar.position);

                if(distance < minDist)
                {
                    minDist = distance;
                    from = fromStar;
                    to = toStar;
                }
            });
        });

        const whid = `WH${this.wormholes.size}`;
        const wormhole = new Wormhole(whid, from, to, minDist);

        this.wormholes.set(whid, wormhole);

        this.dispatchEvent(new CustomEvent("createView", {detail: {model: "wormhole", data: wormhole}}));
    }
}

export  {ModelFactory};