// src/components/AuthVisualPattern.jsx

import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";

// A floating, glowing orb with a GSAP animation
const GlowingOrb = () => {
  const meshRef = useRef();

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  useEffect(() => {
    if (meshRef.current) {
      gsap.to(meshRef.current.position, {
        duration: 5,
        y: 0.5,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
    }
  }, []);

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color="#7C3AED" // A rich, vibrant purple
        emissive="#5B21B6" // A deep, glowing purple
        emissiveIntensity={0.8}
        roughness={0.5}
        metalness={0.9}
      />
    </mesh>
  );
};

// A field of twinkling particles that float and fade
const ParticleField = () => {
  const count = 500;
  const positions = new Float32Array(count * 3);
  const materialRef = useRef();
  const { camera } = useThree();

  // Create a random distribution of particles
  for (let i = 0; i < count * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 15;
  }

  useFrame(() => {
    if (materialRef.current) {
      // Animate the particles to move slowly towards the camera
      const time = performance.now() * 0.0001;
      const attributes = materialRef.current.geometry.attributes;
      for (let i = 0; i < attributes.position.count; i++) {
        attributes.position.array[i * 3 + 2] += 0.005; // Move particles forward
        if (attributes.position.array[i * 3 + 2] > 5) {
          attributes.position.array[i * 3 + 2] = -10;
        }
      }
      attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={materialRef} position={[0, 0, -5]}>
      <bufferGeometry attach="geometry">
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          itemSize={3}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#E0E7FF" // A soft, light blue
        size={0.15}
        sizeAttenuation
        transparent
        opacity={0.7}
      />
    </points>
  );
};

// Main component that combines all elements
const AuthImagePattern = ({ title, subtitle }) => {
  return (
    <div className="hidden lg:flex items-center justify-center relative overflow-hidden bg-gray-950">
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
          <ambientLight intensity={0.4} />
          <pointLight position={[0, 0, 0]} intensity={2.5} color="#A78BFA" />
          <GlowingOrb />
          <ParticleField />
          {/* <OrbitControls enableZoom={false} enablePan={false} /> */}
        </Canvas>
      </div>

      <div className="max-w-md text-center z-10 p-12 text-white">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <p className="text-gray-400">{subtitle}</p>
      </div>
    </div>
  );
};

export default AuthImagePattern;
