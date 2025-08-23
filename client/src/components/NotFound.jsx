// src/pages/NotFound.jsx

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { Link } from "react-router-dom";

const NotFound = () => {
  const mountRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    // 1. Scene and Renderer Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // 2. Set Colors and Fog for Anime Mood
    const fogColor = new THREE.Color(0x1a2a40);
    scene.background = fogColor;
    scene.fog = new THREE.Fog(fogColor, 10, 50);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // 4. Create Animated Grid (The core of the effect)
    const gridHelper = new THREE.GridHelper(100, 100, 0x0000ff, 0x808080);
    gridHelper.material.opacity = 0.3;
    gridHelper.material.transparent = true;
    gridHelper.position.y = -1;
    scene.add(gridHelper);

    // Position the camera to look down the grid
    camera.position.set(0, 5, 15);
    camera.rotation.x = -Math.PI / 8;

    // 5. GSAP Animations for Camera and Scene
    // GSAP to animate the camera's position for a smooth, floating feeling
    gsap.to(camera.position, {
      z: 5,
      y: 2,
      duration: 30,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });
    // GSAP to animate a rotation on the grid for added dynamism
    gsap.to(gridHelper.rotation, {
      y: Math.PI * 2,
      duration: 60,
      ease: "none",
      repeat: -1,
    });
    // GSAP animation for the 2D text overlay
    gsap.fromTo(
      ".not-found-text",
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1, ease: "power3.out" }
    );

    // 6. Render Loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // 7. Handle Window Resize
    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onWindowResize);

    // 8. Cleanup
    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", onWindowResize);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      scene.children.forEach((child) => scene.remove(child));
      renderer.dispose();
      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(gridHelper.rotation);
      gsap.killTweensOf(".not-found-text");
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Three.js canvas container */}
      <div ref={mountRef} className="absolute inset-0 z-0"></div>

      {/* Text Overlay */}
      <div className="not-found-text absolute inset-0 z-10 flex flex-col items-center justify-center text-white">
        <h1 className="text-9xl md:text-[15rem] font-bold drop-shadow-lg leading-none">
          404
        </h1>
        <p className="mt-4 text-3xl md:text-5xl font-semibold tracking-wide drop-shadow-md">
          Page Not Found
        </p>
        <Link
          to={"/"}
          className="mt-8 inline-block px-8 py-3 bg-white/20 backdrop-blur-sm rounded-full text-lg font-medium hover:bg-white/30 transition-colors duration-300"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
