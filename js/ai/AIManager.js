import { Steve } from "./Steve.js";

class AIManager
{
    static AI =
    {
        Steve
    }

    static createAI(name, args)
    {
        console.log("createAI", name, args);

        const clazz = this.AI[name];

        if(clazz)
            return new clazz(...args);
        else
            throw new Error(`Unknown class ${name}`);
    }
}

export {AIManager};