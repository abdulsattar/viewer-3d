import { LightningElement, api } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import three from "@salesforce/resourceUrl/three";
// import * as THREE from 'three';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default class Viewer3d extends LightningElement {
    @api src;
    lightIntensity = 0.6;
    @api background = '#eeeeee';

    initializeThree = false;
    renderedCallback() {
      if (this.initializeThree) {
        return;
      }
  
      this.initializeThree = true;
      Promise.all([loadScript(this, three)]).then(() => {
        this.runThree();
      });
    }

    runThree() {
        const canvas = this.template.querySelector('canvas');
        const camera = new THREE.PerspectiveCamera(
            75,
            canvas.clientWidth / canvas.clientHeight,
            0.1,
            1000
        );

        const renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true
        });
        renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

        // load a resource
        const loader = new THREE.GLTFLoader();
        loader.load(
            this.src,
            object => {
                const scene = new THREE.Scene();
                object.scene.children.forEach(c => {
                    scene.add(c);
                });

                scene.background = new THREE.Color(this.background);

                const box = new THREE.Box3().setFromObject(scene);

                const { x, y } = box.getSize();
                const diagonal = Math.sqrt(x * x + y * y);
                const cameraHeight =
                    (diagonal / 2) * Math.tan(THREE.Math.degToRad(75 / 2));
                camera.position.z = cameraHeight * 2;

                const intensity = this.lightIntensity;

                const lights = [
                    {
                        intensity,
                        position: new THREE.Vector3(
                            box.max.x * 2,
                            box.max.y,
                            box.max.z * 2 + box.getSize().z
                        )
                    },
                    {
                        intensity: intensity / 2,
                        position: new THREE.Vector3(
                            box.min.x * 2,
                            box.max.y,
                            box.max.z * 2 + box.getSize().z
                        )
                    },
                    {
                        intensity,
                        position: new THREE.Vector3(
                            box.min.x * 2,
                            box.max.y,
                            box.min.z * 2
                        )
                    }
                ];

                // Key light

                lights.forEach(l => {
                    const light = new THREE.PointLight(0xe7f0fe, l.intensity);
                    light.position.copy(l.position);
                    light.updateMatrixWorld();
                    camera.add(light);
                });
                scene.add(camera);

                const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
                scene.add(ambientLight);

                window.camera = camera;
                const controls = new THREE.OrbitControls(camera, renderer.domElement);

                const render = () => renderer.render(scene, camera);
                controls.addEventListener('change', render);
                render();

                window.addEventListener('resize', function() {
                    camera.aspect = canvas.clientWidth / canvas.clientHeight;
                    camera.updateProjectionMatrix();
                    renderer.setSize(
                        canvas.clientWidth,
                        canvas.clientHeight,
                        false
                    );
                    render();
                });
            },
            // called when loading is in progresses
            function(xhr) {
                console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
            },
            // called when loading has errors
            function(error) {
                console.log('An error happened', error);
            }
        );
    }
}
