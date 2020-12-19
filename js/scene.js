function reloadBuffer(geometry) {
    // geometry.dispose()
    loadVertices()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(earthData.posArr, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(earthData.normalsArr, 3));
    geometry.setIndex(earthData.indexArr)
}

function vertexShader() {
  return `
	varying vec3 norm;
    void main() {
	  norm = normal;

      vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * modelViewPosition; 
    }
  `
}

function fragmentShader() {
return `
	varying vec3 norm;
      void main() {
        gl_FragColor = vec4(vec3(norm), 1.0);
      }
  `
}

window.onload = function () {
    const gui = new dat.GUI();
    var splitNumSlider = gui.add(earthData, 'splitNum').min(0).max(100);
    var circularSlider = gui.add(earthData, 'circular').min(0.0).max(1.0).step(0.001);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    const light = new THREE.HemisphereLight();
    scene.add(light);

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const geometry = new THREE.BufferGeometry();
    reloadBuffer(geometry);

    const material = new THREE.ShaderMaterial({
		vertexShader: vertexShader(),
		fragmentShader: fragmentShader()
    });
	
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    camera.position.y = -5;
    camera.up = new THREE.Vector3(0.0, 0.0, 1.0);
    camera.lookAt(0.0, 0.0, 0.0);

    const animate = function () {
        requestAnimationFrame(animate);

        //				cube.rotation.x += 0.01;
        cube.rotation.z += 0.01;

        renderer.render(scene, camera);
    };

    animate();

    splitNumSlider.onChange(function (value) {
        reloadBuffer(geometry);
    });

    circularSlider.onChange(function (value) {
        reloadBuffer(geometry);
    });
}
