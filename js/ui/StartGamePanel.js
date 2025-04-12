import { CommonPanel } from "./CommonPanel.js";

class StartGamePanel extends CommonPanel
{
    constructor(control)
    {
        super("Start New Game");

        this.control = control;

        this.mainDiv.classList.add("fullScreen", "commonPanel", "startGamePanel");
        this.titleDiv.classList.add("commonTitleDiv");
        this.contentDiv.classList.add("commonContentDiv");

        console.log("StartGamePanel constructor()", this.mainDiv.style.display);

        const gridDiv = document.createElement("div");

        this.makeNumberInput(gridDiv, "Game Seed", "seed", 1966, 1, 999999);
        this.makeNumberInput(gridDiv, "Number of Sectors across", "width", 2, 1, 9);
        this.makeNumberInput(gridDiv, "Number of Sectors down", "height", 2, 1, 9);
        this.makeNumberInput(gridDiv, "Number of Sectors high*", "depth", 1, 1, 9);
        this.makeNumberInput(gridDiv, "Minimum Stars per Sector", "min", 3, 1, 9);
        this.makeNumberInput(gridDiv, "Maximum Stars per Sector", "max", 5, 1, 9);

        this.contentDiv.append(gridDiv, document.createElement("hr"));

        // so exactly how do I create and add a new player to a game?
        // OPTION #1
        // button is handled by the controller which invokes the create player panel
        // which creates the player and sends it to the controller which then sends it
        // to the start game panel to display and possibly edit/delete
        // I think this would require custom listeners.
        // - controller listens for create player and start game button presses
        // - controller invokes create player panel to create a player
        // - the create player panel either has to call back into controller 
        //   or publish an event that a player has been created for both the controller
        //   and ultimately start game panel to update it's display
        // ? how do we deal with edits?  Are they done in the start game panel UI or
        //   in the original create player panel?  Or do we expose very limited fields
        //   for edit in the start game panel and provide a button for fuller editing?
        // OPTION #2
        // invoke the create player panel from the start game panel and send the result
        // to the controller when the start game button is pressed

        this.addPlayer = document.createElement("button");
        this.addPlayer.addEventListener("click", control.handleAddPlayer.bind(control));
        this.addPlayer.textContent = "Add Player";
        this.playerList = document.createElement("div");
        this.playerList.classList.add("threeColumnGrid");
        this.contentDiv.append(this.addPlayer, this.playerList);

        this.startGame = document.createElement("button");
        this.startGame.addEventListener("click", control.handleStartGame.bind(control));
        this.startGame.textContent = "Start Game";
        this.contentDiv.append(document.createElement("hr"), this.startGame);

        // later optional module selection

        // ? for now create a separate section for developer options

        document.body.append(this.mainDiv);
        this.hide();
    }

    makeNumberInput(div, label, field, value, min, max)
    {
        const input = document.createElement("input");
        input.type = "number";
        input.value = value;
        input.min = min;
        input.max = max;

        this[field] = input;

        const span = document.createElement("span");
        span.textContent = label;

        div.append(span, input);
    }

    show()
    {
        console.clear();
        console.log("StartGamePanel show()", this.display);

        this.mainDiv.style.display = this.display;
    }

    handleAddPlayerEvent(evt)
    {
        this.displayPlayers();
    }

    displayPlayers()
    {
        this.playerList.innerHTML = "";

        this.control.players.forEach(player => 
        {
            const nameSpan = document.createElement("span");
            nameSpan.textContent = player.name;

            const colourDiv = document.createElement("div");
            colourDiv.style = `background-color:${player.colour}; width:3em; height: 1em;`;

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "X";
            deleteButton.dataset.id = player.id;
            deleteButton.addEventListener("click", this.handleDeletePlayer.bind(this));

            this.playerList.append(nameSpan, colourDiv, deleteButton);
        });
    }

    handleDeletePlayer(evt)
    {
        const index = this.control.players.findIndex(p => p.id === evt.target.dataset.id);

        this.control.players.splice(index, 1);

        this.displayPlayers();   
    }
}

export {StartGamePanel};