// src/components/ThreeBackground.jsx
import { useRef, useEffect } from "react";
import * as THREE from "three";
import { gsap } from "gsap";

const ThreeBackground = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    // --- Scene setup ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Make sure the ref is valid before appending
    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

    // Position the camera
    camera.position.z = 5;

    // --- Particle effect ---
    const geometry = new THREE.BufferGeometry();
    const particlesCount = 5000;
    const positions = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 10;
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x888888,
      size: 0.01,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // --- Animation loop with GSAP ---
    const animate = () => {
      requestAnimationFrame(animate);
      particles.rotation.y += 0.0005;
      renderer.render(scene, camera);
    };
    animate();

    // GSAP for camera movement on mouse move
    const onMouseMove = (event) => {
      const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

      gsap.to(camera.position, {
        x: mouseX * 2,
        y: mouseY * 2,
        duration: 1,
      });
    };
    window.addEventListener("mousemove", onMouseMove);

    // Handle window resize
    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onWindowResize);

    // ✅ Clean up on component unmount
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onWindowResize);

      // ✅ Add a check to ensure mountRef.current exists before trying to remove the child
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="fixed inset-0 z-0" />;
};

export default ThreeBackground;
