// This version is not using NODEJS just yet.
import * as G3D from "three";

import { ModelFactory } from "./ModelFactory.js"; 
import { Fleet } from "./Fleet.js";

import { ViewFactory } from "../views/ViewFactory.js";
import { ViewGalaxy } from "../views/ViewGalaxy.js";

import { GamePanel } from "../ui/GamePanel.js";

import { AssetManager } from "../control/AssetManager.js";
import { Fleets } from "../control/Fleets.js";
import { Orders } from "../control/Orders.js";

import { RNG } from "../utils/RNG.js";
import { Ping } from "../utils/Ping.js";
import { Pathfinder } from "../utils/Pathfinder.js";

class Game
{
    constructor(options)
    {
        this.options = options;

        window.gameStart = Date.now();

        console.log("Start new Game():", options);

        G3D.Cache.enabled = true;

        this.turn = 0; // because the first thing we do is end turn :)
        this.ready = false;
        this.seed = +options.seed;

        this.assets = new AssetManager();
        this.modelFactory = new ModelFactory(this.seed);
        this.viewFactory = new ViewFactory(this.assets);
        this.viewGalaxy = new ViewGalaxy(this.modelFactory, this.viewFactory);

        this.modelFactory.addEventListener("createView", this.assets.handleCreateView.bind(this.assets));
        this.modelFactory.addEventListener("updateView", this.viewGalaxy.handleUpdateView.bind(this.viewGalaxy));

        this.assets.addEventListener("assetReady", this.viewFactory.handleAssetReady.bind(this.viewFactory));
        this.assets.addEventListener("createView", this.viewGalaxy.handleCreateView.bind(this.viewGalaxy));
        this.assets.addEventListener("loadingComplete", this.handleLoadingComplete.bind(this));
        
        const z = +options.depth;

        this.viewGalaxy.init(options.container, z === 1);
        this.modelFactory.createStars(new DOMPoint(+options.width, +options.height, z), [+options.min, +options.max]);

        this.currentPlayer = null;
        this.players = new Map();

        console.log(`End new Game(): ${window.gameStart - Date.now()}`);
    }

    handleLoadingComplete(evt)
    {
        console.log(`Start Game.handleLoadingComplete(): ${window.gameStart - Date.now()}`);

        if(this.ready) // if this is true we have already set everything up and started
            return;

        this.ready = true;

        this.options.players.forEach(player => this.addNewPlayer(player));

        this.gamePanel = new GamePanel();
        this.ping = new Ping(this.modelFactory.stars);
        this.pathfinder = new Pathfinder(this.modelFactory.stars);

        this.endGameTurn(); // may want to do something different if a game is simply loaded/resumed

        console.log(`End Game.handleLoadingComplete(): ${window.gameStart - Date.now()}`);
    }

    // Returns null if no player has met victory conditions, otherwise returns player id of winner.
    victoryCheck()
    {
        console.log(`Start Game.victoryCheck(): ${window.gameStart - Date.now()}`);

        const playing = new Set();

        for(let star of this.modelFactory.stars.values())
        {
            const player = star?.government?.controller;

            if(player && !playing.has(player.id))
                playing.add(player.id);

            if(playing.size > 1)
                return null;
        }

        return playing.values().next().value;
    }

    endGameTurn()
    {
        console.time("endGameTurn");

        this.applyMoves();
        this.applyResearch(); // research will impact the cost of building ships
        this.applyBuilds();
        this.applyAutobuild();
        this.applyAutomove();

        this.modelFactory.stars.forEach(star => // also update view - colour and fleet icon and remove empty fleets, review code for fleets[0] kinda thing
        {
            if(star?.government?.controller?.id)
            {
                const player = this.players.get(star.government.controller.id);

                player.bank += star.economy.industry;
            }

            this.modelFactory.notifyModelUpdate({model: "star", id: star.id});
        });

        console.log("Fleets at end of turn", Fleets.FLEETS);

        this.playerOrder = this.determinePlayerOrder();

        this.nextPlayer();
        this.turn++;
        this.gamePanel.showCurrentPlayer();

        const winner = this.victoryCheck();

        console.log(`Winner = ${winner}`);

        if(winner)
        {
            console.log(`There is a winner! ${window.gameStart - Date.now()}`);

            alert(`${this.players.get(winner).name} has won!`);

            return; // dispatch message first maybe?
        }

        console.timeEnd("endGameTurn");
    }

    applyAutobuild()
    {
        // When you have a central bank what does an autobuild percentage mean?
        // Tentatively going to define it as a weighted allocation of the remaining bank balance distributed over star industrial value * percentage.
        // Example two stars have industry 10 (s1) and 5 (s2), current bank balance is 6, s1 percentage is 100%, s2 50%
        // sum of industries is 10 * 100% + 5 * 50% = 12.5
        // s1 will spend 6 * (10 * 100%) / 12.5 => 6 * 10 / 12.5 = 4.8
        // s2 will spend 6 * (5 * 50%) / 12.5 => 6 * 2.5 / 12.5 = 1.2
        // s1 + s2 = 4.8 + 1.2 = 6
        // interestingly this approach results in an autobuild of 1% still consuming the entire bank if it is the only autobuild order!
        // the next version should have banks at each star

        this.players.forEach(player => 
        {
            const orders = [...Orders.AUTO_BUILD.values()].filter(order => order.player === player.id);
            const finalOrders = [];
            let orderSum = 0;

            for(const order of orders)
            {
                const sourceObj = this.modelFactory.stars.get(order.source);
                const value = (sourceObj.economy.industry * order.percentage / 100);

                finalOrders.push(Object.assign({}, order, {value, sourceObj}));

                orderSum += value;
            }

            const currentBank = player.bank;

            finalOrders.forEach(order => 
            {
                const spend = currentBank * order.value / orderSum;

                if(order.type === "industry")
                    this.buildIndustry(order.sourceObj, spend);
                else if(order.type === "ships")
                    this.buildShips(player, order.sourceObj, spend);

                player.bank -= spend;
            });

            console.assert(player.bank >= 0, player.bank, finalOrders);

            if(player.bank < 0)
                player.bank = 0;

            console.groupEnd();
        }); // process next player
    }

    // if the destination is not controlled by the fleet owner then no move is made and the automove order will be deleted
    // if there are no ships to move then the automove order is skipped
    applyAutomove()
    {
        this.players.forEach(player => 
        {
            const orders = [...Orders.AUTO_MOVE.values()].filter(order => order.player === player.id);

            orders.forEach(order =>
            {
                const target = this.modelFactory.stars.get(order.target);

                if(target?.government?.controller?.id === player.id)
                {
                    const fleets = Fleets.getPlayersFleetsAt(player, order.source);
                    const amount = fleets.reduce((sum, fleet) => sum + fleet.ships, 0);

                    if(amount > 0)
                        this.moveShips(order.player, order.source, order.target, amount);
                }
                else
                    Orders.delete("automove", `${order.player}.${order.source}`);
            });
        }); // process next player
    }

    applyResearch()
    {
        Orders.RESEARCH.values().forEach(research => 
        {
            const player = this.players.get(research.player);
            const fleets = Fleets.getPlayersFleets(player);
            const shipCount = fleets.reduce((sum, fleet) => sum + fleet.ships, 0);

            console.log(shipCount, player.techBase, research.amount);

            player.bank -= research.amount;
            player.techBase += research.amount / shipCount;
        });

        Orders.RESEARCH.clear();
    }

    applyBuilds()
    {
        const deleteKeys = new Set();
        
        Orders.BUILD.forEach((build, key) => 
        {
            const player = this.players.get(build.player);
            const star = this.modelFactory.stars.get(build.source);

            player.bank -= build.amount;

            switch(build.type)
            {
                case "industry":
                    this.buildIndustry(star, build.amount);
                    deleteKeys.add(key);
                    break;

                case "ships":
                    const remainder = this.buildShips(player, star, build.amount);

                    if(remainder < 0.1)
                        deleteKeys.add(key);
                    else
                        build.amount = remainder;
                    break;

                default:
                    console.error(`Unknown build type ${build.type}`);
            }
        });

        deleteKeys.forEach(key => Orders.BUILD.delete(key));
    }

    buildIndustry(target, amount)
    {
        target.economy.industry += Math.sqrt(amount);
    }

    buildShips(player, star, amount)
    {
        const count = Math.floor(amount / player.techBase);
        const remainder = amount % player.techBase;
        const fleets = Fleets.getPlayersFleetsAt(player, star.id);

        if(fleets.length === 0)
            Fleets.addFleet(new Fleet(player, star.id, count));
        else if(fleets.length > 1)
            Fleets.mergeFleets(player, star.id).ships += count;
        else
            fleets[0].ships += count;

        return remainder;
    }

    applyMoves()
    {
        const battles = new Set();

        Orders.MOVES.values().forEach(move => 
        {
            const battle = this.moveShips(move.player, move.source, move.target, move.amount);

            if(battle)
                battles.add(move.target);
        });

        Orders.MOVES.clear();

        if(battles.size > 0)
            this.fightBattles(battles);
    }

    moveShips(playerId, sourceId, targetId, amount)
    {
        const player = this.players.get(playerId);
        const source = this.modelFactory.stars.get(sourceId);
        const target = this.modelFactory.stars.get(targetId);
        const fleets = Fleets.getPlayersFleetsAt(player, source.id);

        let fleet = null;

        if(fleets.length === 0)
            throw new Error(`Illegal move, no fleets for ${player.name} at ${source.name}`);
        else if(fleets.length > 1)
            fleet = Fleets.mergeFleets(player, source.id);
        else
            fleet = fleets[0];

        // update existing fleet by reducing it by the move amount or removing it completely
        if(fleet.ships > amount)
            fleet.ships -= amount; 
        else if(fleet.ships === amount)
            Fleets.removeFleet(fleet);
        else
            throw new Error(`Illegal move, not enough ships at ${source.name}`);

        Fleets.addFleet(new Fleet(player, target.id, amount));
        Fleets.mergeFleets(player, target.id);

        // return true if a battles results from this move
        if(target?.government?.controller?.id !== player.id)
            return true;
        else
            return false;
    }

    // this may need a separate class
    // battles is a set of star ids where there is a potential for battle
    fightBattles(battles)
    {
        const attackRatios = new Map();

        // calculate the attack ratio as p1.techBase / (p1.techBase + p2.techBase)
        this.players.forEach(attacker =>
        {
            this.players.forEach(defender => 
            {
                if(attacker.id !== defender.id)
                {
                    const ratio = attacker.techBase / (attacker.techBase + defender.techBase);

                    attackRatios.set(`${attacker.id}.${defender.id}`, ratio);
                }
            });
        });

        battles.forEach(location =>
        {
            const combatants = new Map();
            const star = this.modelFactory.stars.get(location);
            const fleets = Fleets.getFleetsAt(star.id);

            fleets.forEach(fleet => 
            {
                if(combatants.has(fleet.commander.id))
                    combatants.get(fleet.commander.id).push(...Array(fleet.ships).fill(fleet.commander.techBase));
                else
                    combatants.set(fleet.commander.id, Array(fleet.ships).fill(fleet.commander.techBase));
            });

            const rng = new RNG(6691 + this.turn);

            while(combatants.size > 1)
            {
                const all = new Set(combatants.keys());
                
                combatants.forEach((ships, commander) => 
                {
                    const opponents = [...all.difference(new Set([commander]))];

                    ships.forEach(ship => 
                    {
                        const opponent = opponents[Math.floor(opponents.length * rng.next())];
                        const target = Math.floor(rng.next() * combatants.get(opponent).length);
                        const accuracy = attackRatios.get(`${commander}.${opponent}`);

                        if(rng.next() < accuracy)
                            combatants.get(opponent)[target] -= (rng.next() * this.players.get(commander).techBase);
                    });
                });

                combatants.forEach((ships, commander) => combatants.set(commander, ships.filter(ship => ship > 0)));
                combatants.forEach((ships, commander) => 
                {
                    if(ships.length === 0)
                        combatants.delete(commander);
                });
            } // while(combatants.size > 1)

            fleets.forEach(fleet => Fleets.removeFleet(fleet));

            if(combatants.size === 1)
            {
                const winner = this.players.get([...combatants.keys()].pop());

                star.government.controller = winner;

                Fleets.addFleet(new Fleet(winner, location, combatants.get(winner.id).length));
            }
        }); // battles.forEach(location =>
    }

    determinePlayerOrder()
    {
        const start = [...this.players.keys()];
        const order = [];

        while(order.length < start.length)
        {
            const index = Math.floor(Math.random() * start.length);

            if(!order.find(v => v === start[index]))
                order.push(start[index]);
        }

        return order;
    }

    nextPlayer()
    {
        this.currentPlayer = this.players.get(this.playerOrder.shift());

        if(!this.currentPlayer)
            this.endGameTurn();
        else if(this.currentPlayer.ai)
            this.currentPlayer.ai.playTurn();
        else
            this.gamePanel.showCurrentPlayer();
    }

    addNewPlayer(player)
    {
        console.time("addPlayer." + player.id);

        this.players.set(player.id, player);

        const rng = new RNG(6691);
		const stars = [...this.modelFactory.stars.values()];
        
        let index = Math.floor(rng.next() * stars.length);

		while(stars[index].government.controller !== null)
			index = Math.floor(rng.next() * stars.length);

        stars[index].government.controller = player;
        stars[index].economy.industry = 9.66;

        Fleets.addFleet(new Fleet(player, stars[index].id, 10));

        this.modelFactory.notifyModelUpdate({model: "star", id: stars[index].id});

        // if(player.id === "James")
        // {
        //     this.currentPlayer = player;

        //     stars[index - 1].government.controller = player;
        //     Fleets.addFleet(new Fleet(player, stars[index - 1].id, 5));

        //     this.modelFactory.notifyModelUpdate({model: "star", id: stars[index - 1].id});

        //     stars[index - 4].government.controller = player;
        //     Fleets.addFleet(new Fleet(player, stars[index - 4].id, 5));

        //     this.modelFactory.notifyModelUpdate({model: "star", id: stars[index - 4].id});
        // }

        // if(player.id === "Garry")
        // {
        //     console.log(stars[19]);

        //     stars[19].government.controller = player;
        //     Fleets.addFleet(new Fleet(player, stars[19].id, 10));
        // }

        console.timeEnd("addPlayer." + player.id);
    }
}

export {Game};