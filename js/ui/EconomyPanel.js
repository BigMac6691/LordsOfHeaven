// need to figure out how to update the overall bank when money is spent at stars
import { Fleets } from "../control/Fleets.js";
import { Orders } from "../control/Orders.js";
import { CommonPanel } from "./CommonPanel.js";

import { Slider } from "./Slider.js";

class EconomyPanel extends CommonPanel
{
    constructor(title)
    {
        super(title);

        console.log("Constructing EconomyPanel");

        this.mainDiv.classList.add("actionPanel");
        this.contentDiv.classList.add("contentDiv");

        this.industry = document.createElement("p");
        this.ships = document.createElement("p");
        this.contentDiv.append(this.industry, this.ships, document.createElement("hr"));

        const sliderList = 
        [
            {id: "industry", value: 0, label: "Industry"},
            {id: "ships", value: 0, label: "Ships"}
        ];

        this.bankSlider = new Slider(this.contentDiv, 2, 0, sliderList, {text: "Bank"});

        const autoBuildHeader = document.createElement("p");
        autoBuildHeader.innerText = "Autobuilds";

        this.contentDiv.append(document.createElement("hr"), autoBuildHeader);

        const autoBuildSliders = 
        [
            {id: "industry", value: 0, label: "Industry", suffix: "%"},
            {id: "ships", value: 0, label: "Ships", suffix: "%"}
        ];

        this.autoSlider = new Slider(this.contentDiv, 0, 100, autoBuildSliders, {text: "Available", suffix: "%"});

        this.submitButton = document.createElement("button");
        this.submitButton.textContent = "Submit";
        this.submitButton.addEventListener("click", this.handleSubmit.bind(this));
        
        this.cancelButton = document.createElement("button");
        this.cancelButton.textContent = "Cancel";
        this.cancelButton.addEventListener("click", this.handleCancel.bind(this));

        this.submitCancelDiv = document.createElement("div");
        this.submitCancelDiv.append(this.submitButton, this.cancelButton);

        this.mainDiv.append(this.submitCancelDiv);

        document.body.append(this.mainDiv);
        this.hide();
    }

    handleSubmit(evt)
    {
        const player = window.game.currentPlayer;

        this.bankSlider.list.forEach((slider, type) => 
        {
            const key = `${player.id}.${this.source.id}.${type}`;
    
            if(slider.valueAsNumber > 0)
                Orders.set("build", key, {player: player.id, source: this.source.id, type: type, amount: slider.valueAsNumber});
            else
                Orders.delete("build", key);
        });

        this.autoSlider.list.forEach((slider, type) =>
        {
            const key = `${player.id}.${this.source.id}.${type}`;

            console.log("Autobuild", key, slider.valueAsNumber);

            if(slider.valueAsNumber > 0)
                Orders.set("autobuild", key, {player: player.id, source: this.source.id, type: type, percentage: slider.valueAsNumber});
            else
                Orders.delete("autobuild", key);
        });

        this.hide();
    }

    handleCancel(evt)
    {
        this.hide();
    }

    // source here is a star
    show(source, x, y)
    {
        const player = window.game.currentPlayer;

        this.source = source;
        this.title.innerText = source.name;
        this.industry.innerText = `Industry ${source.economy.industry.toFixed(2)}`;

        const ships = Fleets.getPlayersFleetsAt(player, source.id).reduce((sum, fleet) => sum + fleet.ships, 0);
        this.ships.innerText = `Ships ${ships}`;

        const research = Orders.RESEARCH.values().filter(order => order.player === player.id).reduce((sum, order) => sum + order.amount, 0);
        const builds = Orders.BUILD.values().filter(order => order.player === player.id && order.source !== source.id).reduce((sum, order) => sum + order.amount, 0);

        this.bankSlider.list.forEach((slider, key) => 
        {
            const buildKey = `${player.id}.${this.source.id}.${key}`;

            slider.value = Orders.BUILD.has(buildKey) ? Orders.BUILD.get(buildKey).amount : 0;
            slider.max = player.bank - research - builds;
            slider.dispatchEvent(new Event("input", {bubbles: true}));
        });

        this.autoSlider.clearValues();

        this.autoSlider.list.forEach((slider, key) => 
        {
            const buildKey = `${player.id}.${this.source.id}.${key}`;

            slider.value = Orders.AUTO_BUILD.has(buildKey) ? Orders.AUTO_BUILD.get(buildKey).percentage : 0;
            slider.max = 100;
            slider.dispatchEvent(new Event("input", {bubbles: true}));
        });

        this.mainDiv.style.display = "block";
        this.move(x, y);
    }
}

export {EconomyPanel};