// they keys can not be easily broken down and searched, that'd take specialized database like code.
// in fact in the final version this would be a table on a database
class Orders extends EventTarget
{
    static EVENT_DISPATCHER = new EventTarget();

    // {player, source, target, amount}
    static MOVES = new Map();

    // {player, source, type, amount}
    static BUILD = new Map();

    // {player, type, amount}
    static RESEARCH = new Map();

    // {player, source, type, percentage}
    static AUTO_BUILD = new Map();

    // {player, source, target}
    static AUTO_MOVE = new Map();

    static set(target, key, value)
    {
        switch(target)
        {
            case "move":
                this.MOVES.set(key, value);
                break;

            case "build":
                this.BUILD.set(key, value);
                this.EVENT_DISPATCHER.dispatchEvent(new CustomEvent("valueChanged"));
                break;

            // may decide to dispatch events from here as well 
            //    - currently if an economy panel is open but the user updates research the economy panel is not aware of the change
            case "research":
                this.RESEARCH.set(key, value);
                break;

            case "autobuild":
                this.AUTO_BUILD.set(key, value);
                break;

            case "automove":
                this.AUTO_MOVE.set(key, value);
                break;

            default:
                console.error(`Unknwon order target ${target}`);
        }
    }

    static delete(target, key)
    {
        switch(target)
        {
            case "move":
                this.MOVES.delete(key);
                break;

            case "build":
                this.BUILD.delete(key);
                this.EVENT_DISPATCHER.dispatchEvent(new CustomEvent("valueChanged"));
                break;

            case "research":
                this.RESEARCH.delete(key);
                break;

            case "autobuild":
                this.AUTO_BUILD.delete(key);
                break;

            case "automove":
                this.AUTO_MOVE.delete(key);
                break;

            default:
                console.error(`Unknwon order target ${target}`);
        }
    }

    static addEventListener(event, callback)
    {
        this.EVENT_DISPATCHER.addEventListener(event, callback);
    }

    static removeEventListener(event, callback)
    {
        this.EVENT_DISPATCHER.removeEventListener(event, callback);
    }
}

export {Orders}