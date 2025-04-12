import { Orders } from "../control/Orders.js";

import { Slider } from "./Slider.js";

import { DragControl } from "../utils/DragControl.js";

class GamePanel
{
    constructor()
    {
        this.mainDiv = document.createElement("div");
        this.mainDiv.classList.add("mainPanel", "gamePanel");

        this.heading = document.createElement("p");
        this.heading.innerText = `Turn ${window.game.turn}`;

        this.title = document.createElement("p");
        this.title.innerText = "player name goes here";

        this.titleDiv = document.createElement("div");
        this.titleDiv.classList.add("titleDiv");
        this.titleDiv.append(this.heading, this.title);

        this.contentDiv = document.createElement("div");
        this.contentDiv.classList.add("contentDiv");

        this.colour = document.createElement("div")
        this.colour.classList.add("colourBox");
        this.bank = document.createElement("p");
        this.techBase = document.createElement("p");

        this.contentDiv.append(this.colour, this.bank, this.techBase);
        this.contentDiv.append(document.createElement("hr"));

        const sliderList = [{id: "research", value: 0, label: "Research"}];

        this.bankSlider = new Slider(this.contentDiv, 2, 0, sliderList, {text: "Bank"});
        this.bankSlider.list.forEach(slider => slider.addEventListener("focusout", this.handleFocus.bind(this)));

        const turnButton = document.createElement("button");
        turnButton.textContent = "End Turn";
        turnButton.addEventListener("click", this.endTurn.bind(this));

        this.footerDiv = document.createElement("div");
        this.footerDiv.classList.add("footerDiv");
        this.footerDiv.append(turnButton);

        this.mainDiv.append(this.titleDiv, this.contentDiv, this.footerDiv);

        document.body.append(this.mainDiv);

        Orders.addEventListener("valueChanged", this.handleValueChange.bind(this));

        new DragControl(this.mainDiv, this.titleDiv);
    }

    handleValueChange(evt)
    {
        const player = window.game.currentPlayer;
        const builds = Orders.BUILD.values().filter(order => order.player === player.id).reduce((sum, order) => sum + order.amount, 0);

        this.bankSlider.list.forEach(slider => 
        {
            slider.max = player.bank - builds;
            slider.dispatchEvent(new Event("input", {bubbles: true}));
        });
    }

    handleFocus(evt)
    {
        const player = window.game.currentPlayer;

        this.bankSlider.list.forEach((slider, type) => 
        {
            const key = `${player.id}.${type}`;

            if(slider.valueAsNumber > 0)
                Orders.set("research", key, {player: player.id, type: type, amount: slider.valueAsNumber});
            else
                Orders.delete("research", key);
        });
    }

    showCurrentPlayer()
    {
        const player = window.game.currentPlayer;

        this.heading.innerText = `Turn ${window.game.turn}`;
        this.title.innerText = player.name;
        this.colour.style.backgroundColor = player.colour;
        this.techBase.innerText = `Technology Base: ${player.techBase.toFixed(2)}`;

        this.bankSlider.list.forEach(slider => 
        {
            slider.value = 0;
            slider.max = player.bank;
            slider.dispatchEvent(new Event("input", {bubbles: true}));
        });
    }

    endTurn(evt)
    {
        const player = window.game.currentPlayer;

        window.game.nextPlayer();
    }
}

export {GamePanel}