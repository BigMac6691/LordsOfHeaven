# Lords of Heaven
## ModelFactory.js
- This is where game map model objects are constructed.
- References to all such objects created are also kept here.
- When an object is created as message is sent to the AssetManager.
## AssetManager.js
- This is where all external assets are kept.
- There is also a set of rules for each model that lists the assets needed to construct the view for that model.
- When a model requires a asset that hasn't been loaded yet then the loading is started.
- While the asset is loading all messages for that model will be placed in a queue.
- When an asset is finished loading an `assetReady` message is sent to the ViewFactory so it it can use it.
    - NOTE this should only be necessary for resources that are needed at start up and not connected to a given model.
- Whenever an asset is loaded a check is made to see if all the assets for the model that needed that asset have been loaded.
- If all assets have been loaded for a given model then all queue messages for that model will be sent to any and all registered `createView` event listeners; i.e. views.
- There will also be a `getAsset(asset)` method to get the actual asset when needed.  It will throw an exception if it is called and the asset isn't loaded yet.
    - <mark>The system is designed to only try to create a view of a model object once all the assets requied by that model have been loaded so there should never be a call to get an asset that hasn't been loaded yet.</mark>
## ViewFactory.js
- This is where model objects get their corresponding view objects created.
## ViewGalaxy.js
- This primary responsibility of this class is to handle user events for the Galaxy view.
- This is where the `render()` method exists.
- It will have references to both the ModelFactory and ViewFactory.
- It will contain references to all viewable objects.