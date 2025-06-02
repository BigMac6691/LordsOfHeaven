import * as G3D from "three";

import { TrackballControls } from "three/addons/controls/TrackballControls.js";

import { InfoPanel } from "../ui/InfoPanel.js";
import { EconomyPanel } from "../ui/EconomyPanel.js";
import { MovePanel } from "../ui/MovePanel.js";

import { Fleets } from "../control/Fleets.js";

class ViewGalaxy 
{
    constructor(modelFactory, viewFactory) 
    {
        this.MF = modelFactory;
        this.VF = viewFactory;

        this.units = 1000;
        this.fov = 60;
        this.near = 0.1;
        this.far = 5000;

        this.pointer = new G3D.Vector2();
        this.raycaster = new G3D.Raycaster();

        this.starGroups = new Map();
        this.wormholes = new Map();

        this.clickable = []; // for raycaster
    }

    init(container, noRotate) // TODO maybe consider recording the dimensions property of the game to calculate noRotate
    {
        console.log(`Start ViewGalaxy.init: ${window.gameStart - Date.now()}`);

        this.infoPanel = new InfoPanel("Star Information");
        this.economyPanel = new EconomyPanel("Economy Panel");
        this.movePanel = new MovePanel("Move Fleets");

        this.camera = new G3D.PerspectiveCamera(this.fov, container.offsetWidth / container.offsetHeight, this.near, this.far);
        this.camera.position.set(this.units / 2, this.units / 2, this.units * Math.sin(Math.PI * this.fov / 180));

        const light = new G3D.DirectionalLight(0xffffff, 3);
        light.position.copy(this.camera.position);

        this.scene = new G3D.Scene();
        this.scene.add(new G3D.HemisphereLight(0xffffff, 0x999999, 0.3));
        this.scene.add(this.camera, light);

        this.renderer = new G3D.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(container.offsetWidth, container.offsetHeight);

        container.appendChild(this.renderer.domElement);
        
        this.control = new TrackballControls(this.camera, this.renderer.domElement);
        this.control.target.set(this.units / 2, this.units / 2, 0);
        this.control.noRotate = noRotate;
        this.control.addEventListener("end", this.controlChangeEnd.bind(this));
        
        this.renderer.setAnimationLoop(this.render.bind(this));
        
        container.addEventListener("mousemove", this.handleMouseMove.bind(this));
        container.addEventListener("click", this.handleMouseClick.bind(this));

        console.log(`End ViewGalaxy.init: ${window.gameStart - Date.now()}`);
    }

    // this event comes from the trackball controller
    controlChangeEnd(evt)
    {
        if(this.infoPanel.isShowing())
            this.infoPanel.hide();
    }

    handleCreateView(evt)
    {
        switch(evt.detail.model)
        {
            case "star":
                this.addStar(evt.detail.data);
                break;

            case "wormhole":
                this.addWormhole(evt.detail.data);
                break;

            default:
                console.warn("Unable to handle createView message: ", evt);
        }
    }

    handleUpdateView(evt)
    {
        switch(evt.detail.model)
        {
            case "star":
                this.updateStar(evt.detail);
                break;

            case "wormhole":
                this.updateWormhole(evt.detail);
                break;

            default:
                console.log("error");
        }
    }

    updateStar(detail)
    {
        const starModel = this.MF.stars.get(detail.id);
        const starView = this.starGroups.get(detail.id);

        if(starModel?.government?.controller)
        {
            starView.star.material.color = new G3D.Color(starModel.government.controller.colour);
            starView.fleetIcon.visible = Fleets.hasFleetsAt(starModel.id);
        }
    }

    // does nothing at the moment, in future may record if the wormhole is know to a given player
    updateWormhole(detail)
    {

    }

    addStar(model)
    {
        const view = this.VF.makeStar(model);

        this.clickable.push(view.star, view.fleetIcon);
        this.starGroups.set(model.id, view);

        if(model.government.controller)
            view.star.material.color = new G3D.Color(model.government.controller.colour);

        view.fleetIcon.visible = Fleets.hasFleetsAt(model.id);

        this.scene.add(view.group);
    }

    addWormhole(model)
    {
        const view = this.VF.makeWormhole(model);

        this.wormholes.set(model.id, view);

        this.scene.add(view);
    }

    // returns the view obect which contains the userData object.
    getTarget(evt)
    {
        this.pointer.x = (evt.clientX / window.innerWidth) * 2 - 1;
        this.pointer.y = -(evt.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.pointer, this.camera);

        const intercepts = this.raycaster.intersectObjects(this.clickable);

        let result = null;

        if(intercepts.length)
        {
            let object = intercepts[0].object;

            while(object.parent && !result)
                if(object.userData.GJM)
                    result = object;
                else
                    object = object.parent;
        }

        return result;
    }

    handleMouseMove(evt)
    {
        const target = this.getTarget(evt);

        if(target)
        {
            if(this.infoPanel.isShowing())
            {
                this.infoPanel.move(evt.clientX, evt.clientY);

                return;
            }

            const info = this.determineInfoContent(target.userData);

            this.infoPanel.show(info.title, info.content, evt.clientX, evt.clientY);
        }
        else if(this.infoPanel.isShowing())
            this.infoPanel.hide();
    }

    // receives userData
    determineInfoContent(target)
    {
        const player = window.game.currentPlayer;
        const content = [];
        const star = this.MF.stars.get(target.id);

        switch(target.type)
        {
            case "star":
                content.push(`Owner: ${star.government.controller ? star.government.controller.name : "Neutral"}`);
                content.push(`Industry: ${star.economy.industry.toFixed(2)}`);
                break;

            case "fleet":
                // Fleets.getPlayersFleetsAt(player, star.id).forEach(fleet => content.push(`${fleet.commander.name}:  ${fleet.ships} ships`));
                Fleets.getFleetsAt(star.id).forEach(fleet => content.push(`${fleet.commander.name}:  ${fleet.ships} ships`));
                break;

            default:
                console.warn("Unable to determine InfoPanel content for: ", target);
        }

        return {title: star.name, content: content};
    }

    handleMouseClick(evt)
    {
        // target here is the on screen visible element
        const target = this.getTarget(evt);

        if(target === null)
            return;

        const model = this.MF.stars.get(target.userData.id);

        switch(target.userData.type)
        {
            case "star":
                const owned = model?.government?.controller?.id === window.game.currentPlayer.id;

                if(owned) // if you click on a star not owned by you then you can only move ships to there for combat
                    this.economyPanel.show(model, evt.clientX, evt.clientY);
                else
                    this.movePanel.show(model, evt.clientX, evt.clientY);
                break;

            case "fleet":
                this.movePanel.show(model, evt.clientX, evt.clientY);
                break;

            default:
                console.warn("Unknown type for click content: ", target);
        }
    }

    render() 
    {
        this.control.update();

        this.starGroups.forEach(star => star.group.quaternion.copy(this.camera.quaternion));

        this.renderer.render(this.scene, this.camera);
    }
}

export { ViewGalaxy };