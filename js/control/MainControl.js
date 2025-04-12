import { CreatePlayer } from "../ui/CreatePlayer.js";
import { IntroPanel } from "../ui/IntroPanel.js";
import { StartGamePanel } from "../ui/StartGamePanel.js";

import { Player } from "../models/Player.js"; // only for testing

import { Game } from "../models/Game.js";

class MainControl
{
    constructor()
    {
        this.players = [];

        this.introPanel = new IntroPanel(this);
        this.startGamePanel = new StartGamePanel(this);
        this.createPlayerPanel = new CreatePlayer(this);

        this.createPlayerPanel.addEventListener("addPlayer", this.handleAddPlayerEvent.bind(this));
        this.createPlayerPanel.addEventListener("addPlayer", this.startGamePanel.handleAddPlayerEvent.bind(this.startGamePanel));
    }

    handleNewGame(evt)
    {
        this.introPanel.hide();
        this.startGamePanel.show();
    }

    handleLoadGame(evt)
    {
        console.log("Load", evt);
    }

    handleAddPlayer(evt)
    {
        this.createPlayerPanel.show();
    }

    handleStartGame(evt)
    {
        console.log("startGame", this.players.length, evt);

        if(!this.players.length)
        {
            // alert("There must be at least player to start the game!");

            // return;

            // only while testing!!!
            this.players.push(new Player("Garry", "#ff0000"));
            // this.players.push(new Player("James", "#00ff00"));
            this.players.push(new Player("MacGregor", "#0000ff"));
        }

        this.startGamePanel.hide();

        const options =
        {
            container: document.getElementById("sceneContainer"),
            seed: this.startGamePanel.seed.value,
            width: this.startGamePanel.width.value,
            height: this.startGamePanel.height.value,
            depth: this.startGamePanel.depth.value,
            min: this.startGamePanel.min.value,
            max: this.startGamePanel.max.value,
            players: this.players
        };

        this.game = new Game(options);

        window.game = this.game;
    }

    handleAddPlayerEvent(evt)
    {
        this.players.push(evt.detail);
    }
}

export {MainControl}