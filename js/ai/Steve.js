// Smart AI
// core features include
// assess risk at each part of the border
// assess value of each part of the border
// scout beyond borders
// assess value of scouted parts
// determine build orders
// determine move orders
// determine attack points
// determine points of defense
// ? determine where choke points are
// ? be aware of the map in depth with or without fog of war
class Steve
{
    constructor(player)
    {
        this.player = player;

        console.log(`${player.name} will be using the Steve AI`);
    }

    playTurn()
    {
        console.log("playing turn with Steve AI");

        const borders = window.game.ping.borders(this.player.id);

        console.log(`${this.player.name}'s current borders are:`, borders);
    }
}

export {Steve};