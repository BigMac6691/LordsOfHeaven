import { CommonPanel } from "./CommonPanel.js";

import { Player } from "../models/Player.js";

import { ColorUtils } from "../utils/ColorUtils.js";
import { DragControl } from "../utils/DragControl.js";

class CreatePlayer extends CommonPanel
{
    constructor(control)
    {
        super("Create Player");

        this.control = control;

        // name and colour for now
        this.mainDiv.classList.add("commonPanel", "createPlayerPanel");
        this.titleDiv.classList.add("commonTitleDiv");
        this.contentDiv.classList.add("commonContentDiv");
        console.log("CreatePlayer constructor()", this.mainDiv.style.display);

        const span1 = document.createElement("span");
        span1.textContent = "Name";

        this.name = document.createElement("input");
        this.name.type = "text";
        this.name.minLength = 3;
        this.name.maxLength = 10;
        this.name.size = 10;
        this.name.value = "Garry";
        this.name.placeholder = "name";

        const span2 = document.createElement("span");
        span2.textContent = "Colour";

        this.colour = document.createElement("input");
        this.colour.type = "color";
        this.colour.value = "#00ff00";

        this.create = document.createElement("button");
        this.create.addEventListener("click", this.handleCreatePlayer.bind(this));
        this.create.textContent = "Create Player";

        this.cancel = document.createElement("button");
        this.cancel.addEventListener("click", this.hide.bind(this));
        this.cancel.textContent = "Cancel";

        this.contentDiv.append(span1, this.name, span2, this.colour, this.create, this.cancel);

        document.body.append(this.mainDiv);
        this.hide();

        new DragControl(this.mainDiv, this.titleDiv);
    }

    show()
    {
        console.log("CreatePlayer show()", this.display);

        this.mainDiv.style.display = this.display;
    }

    handleCreatePlayer(evt)
    {
        console.log("handleCreatePlayer", evt, this.colour);

        let message = [];

        for(const p of this.control.players)
        {
            if(p.name === this.name.value)
                message.push(`Name "${this.name.value}" already in use.`);

            if(!ColorUtils.isHexColorDifferent(this.colour.value, p.colour))
                message.push("Colour too similar to one already in use.");

            if(message.length)
                break;
        }

        if(message.length)
        {
            alert(`${message.length} errors found:\n${message[0]}${message.length > 1 ? "\n" + message[1] : ""}`);

            return;
        }
        else
        {
            this.dispatchEvent(new CustomEvent("addPlayer", {detail: new Player(this.name.value, this.colour.value)}));
            this.hide();
        }
    }
}

export {CreatePlayer};