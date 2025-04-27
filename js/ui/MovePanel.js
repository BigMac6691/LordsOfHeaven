import { Orders } from "../control/Orders.js";
import { Fleets } from "../control/Fleets.js";

import { Slider } from "./Slider.js";

import { DragControl } from "../utils/DragControl.js";
import { CommonPanel } from "./CommonPanel.js";

// this class will funciton in different ways depending on if you own the star or not.
// If you own the star you will be allowed to send ships *from* here to other stars.
// If you do not own the star then you will be prompted to send ships *to* here from other stars.
class MovePanel extends CommonPanel
{
    constructor(title)
    {
        super(title);

        this.mainDiv.classList.add("mainPanel", "fleetPanel");

        const heading = document.createElement("p");
        heading.innerText = "Fleet Manager";

        this.titleDiv.classList.add("titleDiv");
        this.titleDiv.prepend(heading);

        this.contentDiv.classList.add("contentDiv");

        this.submitButton = document.createElement("button");
        this.submitButton.textContent = "Submit";
        this.submitButton.addEventListener("click", this.handleSubmit.bind(this));
        
        this.cancelButton = document.createElement("button");
        this.cancelButton.textContent = "Cancel";
        this.cancelButton.addEventListener("click", this.handleCancel.bind(this));

        this.footerDiv = document.createElement("div");
        this.footerDiv.classList.add("footerDiv");
        this.footerDiv.append(this.submitButton, this.cancelButton);

        this.mainDiv.append(this.footerDiv);

        document.body.append(this.mainDiv);
        this.hide();

        new DragControl(this.mainDiv, this.titleDiv);
    }

    // will be passed the star as the source
    show(source, x, y)
    {
        this.source = source;

        while(this.contentDiv.firstChild)
            this.contentDiv.removeChild(this.contentDiv.firstChild);

        this.title.innerText = source.name;

        this.moves = new Map();

        const owned = source?.government?.controller?.id === window.game.currentPlayer.id;
        
        if(owned)
            this.displayOwn(source);
        else
            this.displayOther(source);

        this.mainDiv.style.display = "block";
        this.move(x, y);
    }

    // will be passed the clicked on star as source, the clicked on star is owned by current player
    // here we are moving ships FROM this star TO other adjacent stars
    displayOwn(source)
    {
        const player = window.game.currentPlayer;
        const available = Fleets.getPlayersFleetsAt(player, source.id).reduce((sum, fleet) => sum + fleet.ships, 0);
        const sliderList = [];
        const friendly = [];

        source.wormholes.forEach(hole => 
        {
            const target = hole.getTarget(source.id);
            const key = `${player.id}.${source.id}.${target.id}`;
            const current = Orders.MOVES.has(key) ? Orders.MOVES.get(key).amount : 0;
            const hostile = target?.government?.controller?.id !== player.id;

            if(!hostile)
                friendly.push(target);

            sliderList.push({id: target.id, value: current, label: `${hostile ? "Attack" : "Reinforce"} ${target.name}`, cssClass: hostile ? "hostile" : "friendly"});
        });

        this.moves.set(source.id, new Slider(this.contentDiv, 0, available, sliderList, {text: "Available ships"}));

        if(friendly.length)
        {
            const autoMoveHeader = document.createElement("p");
            autoMoveHeader.innerText = "Automove"; // build a drop down

            this.autoMove = document.createElement("select");
            this.autoMove.add(this.createOption("none", "None"));
            friendly.forEach(dest => this.autoMove.add(this.createOption(dest.id, dest.name)));

            const key = `${player.id}.${source.id}`;

            if(Orders.AUTO_MOVE.has(key))
                this.autoMove.value = Orders.AUTO_MOVE.get(key).target;

            const autoMoveDiv = document.createElement("div");
            autoMoveDiv.append(autoMoveHeader, this.autoMove);
    
            this.contentDiv.append(document.createElement("hr"), autoMoveDiv);
        }
    }

    createOption(value, text)
    {
        const option = document.createElement("option");
        option.value = value;
        option.text = text;

        return option;
    }

    // will be passed the clicked on star as source, the clicked on star is NOT owned by the current player
    // here we are moving ships from adjacent stars owned by current player to this star - i.e. attacking (usually :))
    displayOther(source)
    {
        const player = window.game.currentPlayer;

        source.wormholes.forEach(hole => 
        {
            const attacker = hole.getTarget(source.id);

            if(attacker?.government?.controller?.id === player.id) // only consider adjacent stars controlled by current player
            {
                if(this.moves.size > 0)
                    this.contentDiv.append(document.createElement("hr"));

                let available = Fleets.getPlayersFleetsAt(player, attacker.id).reduce((sum, fleet) => sum + fleet.ships, 0);
                let attacking = 0;

                attacker.wormholes.forEach(target => 
                {
                    const attacked = target.getTarget(attacker.id);
                    const key = `${player.id}.${attacker.id}.${attacked.id}`;
                    const order = Orders.MOVES.get(key);

                    if(order)
                    {
                        if(attacked.id === source.id)
                            attacking = order.amount;
                        else // ships are moving elsewhere so reduce total available
                            available -= order.amount;
                    }
                });

                const sliderList = [{id: source.id, value: attacking, label: `Attacking from ${attacker.name}`, cssClass: "hostile"}];

                this.moves.set(attacker.id, new Slider(this.contentDiv, 0, available, sliderList, {text: "Available ships"}));
            }
        });
    }

    handleSubmit(evt)
    {
        const player = window.game.currentPlayer;

        this.moves.forEach((targets, sourceKey) => 
        {
            const source = window.game.modelFactory.stars.get(sourceKey);

            // list in this context is an array of sliders, each slider is a single target
            targets.list.forEach((slider, targetKey) => 
            {
                const key = `${player.id}.${sourceKey}.${targetKey}`;

                if(slider.valueAsNumber > 0)
                    Orders.set("move", key, {player: player.id, source: sourceKey, target: targetKey, amount: slider.valueAsNumber});
                else
                    Orders.delete("move", key);
            });
        });

        if(this.autoMove)
        {
            const key = `${player.id}.${this.source.id}`;

            if(this.autoMove.value === "none")
                Orders.delete("automove", key);
            else
                Orders.set("automove", key, {player: player.id, source: this.source.id, target: this.autoMove.value});
        }

        this.hide();
    }

    handleCancel(evt)
    {
        this.hide();
    }
}

export {MovePanel};