import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

class AssetManager extends EventTarget
{
    constructor()
    {
        super();

        this.required = new Map();
        this.assets = new Map();
        this.loading = new Map();
        this.queue = new Set();

        // temporary - find another way to get this data into the AM later
        this.required.set("star", 
        [
            {"loader": "font", "path": "../libs/threejs/fonts/helvetiker_regular.typeface.json"},
            {"loader": "gltf", "path": "../assets/toy_rocket_4k_free_3d_model_gltf/scene.gltf"}
        ]);
        console.log(this.required);
    }

    handleCreateView(evt)
    {
        const missingAssets = this.getMissingAssets(evt.detail.model);

        if(missingAssets.length === 0) // assets are loaded, just dispatch the message for consumers
            this.dispatchEvent(new CustomEvent(evt.type, {detail: evt.detail}));
        else
        {
            // at least one asset is missing, if it is not being loaded then start the load now
            missingAssets.forEach(rule => 
            {
                if(!this.loading.has(rule.path))
                    this.loadAsset(rule, evt.detail.model);
            });

            // don't process the message now, put it in a queue to send when all required assets have loaded
            this.queue.add({eventType: evt.type, detail: evt.detail});
        }
    }

    handleUpdateView(evt)
    {
        console.log(evt);
    }

    getAsset(asset)
    {
        return this.assets.get(asset);
    }

    // returns list of required assets for given model that aren't LOADED.
    getMissingAssets(model)
    {
        if(!this.required.has(model))
            return []; // there are no required assets for this model

        return this.required.get(model).filter(rule => !this.assets.has(rule.path));
    }

    loadAsset(rule, model)
    {
        if(this.loading.has(rule.path))
            this.loading.get(rule.path).push(model);
        else
            this.loading.set(rule.path, [model]);

        switch(rule.loader)
        {
            case "font":
                this.loadFont(rule);
                break;

            case "gltf":
                this.loadGLTF(rule);
                break;

            default:
                throw new Error(`Unknown asset type: [${rule.loader}]`);
        }
    }

    successfulLoad(rule)
    {
        console.log(`Start successfulLoad for ${JSON.stringify(rule)}: ${window.gameStart - Date.now()}`);

        this.dispatchEvent(new CustomEvent("assetReady", {detail: {asset: rule.path}}));

        // loading has an array of all models waiting for the asset
        // if getMissingAssets() returns empty array then the model has all it's assets, send it's queued messages
        const readyModels = new Set(this.loading.get(rule.path).filter(model => this.getMissingAssets(model).length === 0));

        this.queue.forEach(message => 
        {
            if(readyModels.has(message.detail.model))
            {
                this.queue.delete(message);
                this.dispatchEvent(new CustomEvent(message.eventType, {detail: message.detail}));
            }
        });

        this.loading.delete(rule.path);

        if(this.loading.size === 0)
            this.dispatchEvent(new CustomEvent("loadingComplete"));

        console.log(`End successfulLoad for ${JSON.stringify(rule)}: ${window.gameStart - Date.now()}`);
    }

    loadFont(rule)
    {
        console.log(`Start loadFont: ${window.gameStart - Date.now()}`);

        new FontLoader().load(rule.path, 
        response => 
        {
            console.log(`\n\tResponse loadFont: ${window.gameStart - Date.now()}`);

            this.assets.set(rule.path, response); // must do this here or getMissingAssets() won't work properly
            
            this.successfulLoad(rule);

            console.log(`\n\tDispatch loadFont: ${window.gameStart - Date.now()}`);
        },
        xhr =>
        {
            console.log(rule, xhr);
        },
        error =>
        {
            console.log(error);
        });
    }

    loadGLTF(rule)
    {
        console.log(`Start loadGLTF: ${window.gameStart - Date.now()}`);

        new GLTFLoader().load(rule.path,
        response =>
        {
            console.log(`\n\tResponse loadGLTF: ${window.gameStart - Date.now()}`);

            this.assets.set(rule.path, response.scene); // must do this here or getMissingAssets() won't work properly
            
            this.successfulLoad(rule);

            console.log(`\n\tDispatch loadGLTF: ${window.gameStart - Date.now()}`);
        },
        xhr =>
        {
            console.log(rule, xhr);
        },
        error =>
        {
            console.log(error);
        });
    }
}

export {AssetManager}