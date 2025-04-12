import * as G3D from "three";

import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

class ViewFactory extends EventTarget
{
    constructor(assetManager)    
    {
        super();

        this.assets = assetManager;

        this.starRadius = 5;
        this.starGeometry = new G3D.SphereGeometry(this.starRadius, 30, 30);
        this.labelMaterial = new G3D.MeshPhongMaterial({ color: 0xffffff, flatShading: true });
        this.labelConfig = 
        {
            font: null, // this to be loaded by asset manager later
            size: 2 * this.starRadius,
            depth: 0.3,
            curveSegments: 6,
            bevelThickness: 0.2,
            bevelSize: 0.15,
            bevelEnabled: true
        };

        this.holeMaterial = new G3D.MeshBasicMaterial({color: 0xffffff});
    }

    handleAssetReady(evt)
    {
        console.log(evt);

        switch(evt.detail.asset)
        {
            case "../libs/threejs/fonts/helvetiker_regular.typeface.json":
                this.labelConfig.font = this.assets.getAsset(evt.detail.asset);
                break;

            case "../assets/toy_rocket_4k_free_3d_model_gltf/scene.gltf":
                this.assets.getAsset(evt.detail.asset).scale.set(4, 4, 4);
                break;

            default:
                console.log(`Asset "${evt.detail.asset}" is ready for use.`, this.assets.getAsset(evt.detail.asset));
        }
    }

    // The GJM attribue in the userData is used to mark game objects of interest.
    // When you load an object from a third party they may have a deeply nested structure, so you need a way to find
    // the object you are interested in.  To do that I am using what I hope to be a very unique attribute my initials :)
    makeStar(star)
    {
        const mesh = new G3D.Mesh(this.starGeometry, new G3D.MeshStandardMaterial({color: 0xbbbbbb}));
        mesh.name = star.name;
        mesh.userData = {id: star.id, type: "star", GJM: true};
        
        const labelGeometry = new TextGeometry(mesh.name, this.labelConfig);
        const label = new G3D.Mesh(labelGeometry, this.labelMaterial);
        
        labelGeometry.computeBoundingBox();
        label.position.y = -(2 * this.starRadius + 0.8 * this.labelConfig.size);
        label.position.x = -0.5 * (labelGeometry.boundingBox.max.x - labelGeometry.boundingBox.min.x);

        const fleetIcon = this.assets.getAsset("../assets/toy_rocket_4k_free_3d_model_gltf/scene.gltf").clone(true);
        fleetIcon.userData = {id: star.id, type: "fleet", GJM: true};
        fleetIcon.position.x = 10;
        fleetIcon.position.y = -6;

        const group = new G3D.Group();
        group.position.copy(star.position);
        group.name = star.name + "_group";
        group.userData = {id: star.id, type: "starGroup", GJM: true};
        group.add(mesh, label, fleetIcon);

        return {"star": mesh, "group": group, "fleetIcon": fleetIcon};
    }

    makeWormhole(hole)
    {
        console.time("VF.makeWormhole");

        const p0 = hole.star0.position;
        const p1 = hole.star1.position;
        const dist = hole.distance - 2 * this.starRadius - 2;
        const geometry = new G3D.CylinderGeometry(0.5, 0.5, dist);
        const line = new G3D.Mesh(geometry, this.holeMaterial);
        line.position.copy(new G3D.Vector3().addVectors(p0, p1).divideScalar(2));
        line.lookAt(p0);
        line.rotateX(Math.PI * 0.5);
        line.userData = {id: hole.id, type: "wormhole"};

        const quaternion = line.quaternion;
        const localTop = new G3D.Vector3(0, dist / 2, 0);
        const localBottom = new G3D.Vector3(0, -dist / 2, 0);

        // keep this commented out code for some later tests
        // I am not always certain that p0 always corresponds to worldTop, I think if I reverse the order top and bottom would flip as well
        // One way to correct this is to calculate the distance between p0 and top and bottom and assign to the closest
        
        // const worldTop = localTop.clone().applyQuaternion(quaternion).add(line.position);
        // const worldBottom = localBottom.clone().applyQuaternion(quaternion).add(line.position);

        // console.log(hole.star0.name, hole.star1.name);
        // console.log(p0, p1);
        // console.log(worldTop, worldBottom);

        // hole.point0 = worldTop;
        // hole.point1 = worldBottom;

        hole.point0 = localTop.clone().applyQuaternion(quaternion).add(line.position);
        hole.point1 = localBottom.clone().applyQuaternion(quaternion).add(line.position);

        console.timeEnd("VF.makeWormhole");

        return line;
    }
}

export {ViewFactory};