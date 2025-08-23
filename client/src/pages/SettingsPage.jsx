
// import React, { useEffect, useRef } from "react";
// import gsap from "gsap";
// import * as THREE from "three";
// import { useThemeStore } from "../store/useThemeStore";
// import { THEMES } from "../constants";

// const SettingsPage = () => {
//   const { theme, setTheme } = useThemeStore();
//   const containerRef = useRef(null);
//   const webglRef = useRef(null); // holds renderer.domElement

//   // Stagger-in on mount
//   useEffect(() => {
//     gsap.fromTo(
//       ".theme-btn",
//       { opacity: 0, y: 32, scale: 0.8, rotate: -6 },
//       {
//         opacity: 1,
//         y: 0,
//         scale: 1,
//         rotate: 0,
//         duration: 0.5,
//         stagger: 0.03,
//         ease: "back.out(1.6)",
//       }
//     );
//   }, []);

//   // --- helpers for click effects ---
//   const clickBurst = (el) => {
//     const tl = gsap.timeline();
//     tl.to(el, { scale: 1.1, duration: 0.12, ease: "power2.out" })
//       .to(el, { scale: 1, duration: 0.35, ease: "elastic.out(1, 0.4)" }, 0.12)
//       .fromTo(
//         el,
//         { boxShadow: "0 0 0px rgba(0,0,0,0)" },
//         {
//           boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
//           duration: 0.25,
//           ease: "power2.out",
//         },
//         0
//       )
//       .to(
//         el,
//         {
//           boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
//           duration: 0.35,
//           ease: "power2.inOut",
//         },
//         0.2
//       );
//   };

//   const spawnRipple = (e) => {
//     const btn = e.currentTarget;
//     const rect = btn.getBoundingClientRect();
//     const d = Math.max(rect.width, rect.height);

//     const ripple = document.createElement("span");
//     // style via inline to avoid external CSS
//     Object.assign(ripple.style, {
//       position: "absolute",
//       left: `${e.clientX - rect.left - d / 2}px`,
//       top: `${e.clientY - rect.top - d / 2}px`,
//       width: `${d}px`,
//       height: `${d}px`,
//       borderRadius: "9999px",
//       background: "currentColor", // uses theme’s primary via text-primary class
//       opacity: "0.25",
//       pointerEvents: "none",
//       transform: "scale(0)",
//       mixBlendMode: "screen",
//       filter: "blur(1px)",
//     });

//     btn.appendChild(ripple);
//     gsap.to(ripple, {
//       scale: 2.6,
//       opacity: 0,
//       duration: 0.6,
//       ease: "power2.out",
//       onComplete: () => ripple.remove(),
//     });
//   };

//   // Three.js animated background
//   useEffect(() => {
//     if (!containerRef.current) return;

//     const scene = new THREE.Scene();
//     const camera = new THREE.PerspectiveCamera(
//       75,
//       window.innerWidth / window.innerHeight,
//       0.1,
//       1000
//     );
//     const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
//     renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
//     renderer.setSize(window.innerWidth, window.innerHeight);

//     // prevent double-append in React StrictMode
//     if (!webglRef.current) {
//       containerRef.current.appendChild(renderer.domElement);
//       webglRef.current = renderer.domElement;
//     }

//     const geometry = new THREE.TorusKnotGeometry(8, 3, 220, 36);
//     const material = new THREE.MeshStandardMaterial({
//       color: 0x9f7aea, // violet-ish wireframe works on most themes
//       wireframe: true,
//     });
//     const mesh = new THREE.Mesh(geometry, material);
//     scene.add(mesh);

//     const light = new THREE.PointLight(0xffffff, 1.4);
//     light.position.set(25, 25, 25);
//     scene.add(light);

//     camera.position.z = 30;

//     let rafId;
//     const animate = () => {
//       rafId = requestAnimationFrame(animate);
//       mesh.rotation.x += 0.0045;
//       mesh.rotation.y += 0.009;
//       renderer.render(scene, camera);
//     };
//     animate();

//     const handleResize = () => {
//       camera.aspect = window.innerWidth / window.innerHeight;
//       camera.updateProjectionMatrix();
//       renderer.setSize(window.innerWidth, window.innerHeight);
//     };
//     window.addEventListener("resize", handleResize);

//     return () => {
//       cancelAnimationFrame(rafId);
//       window.removeEventListener("resize", handleResize);

//       // safely detach canvas (avoid null parent errors)
//       if (webglRef.current && webglRef.current.parentNode) {
//         webglRef.current.parentNode.removeChild(webglRef.current);
//       }
//       webglRef.current = null;

//       renderer.dispose();
//       geometry.dispose();
//       material.dispose();
//     };
//   }, []);

//   return (
//     <div className="relative w-full h-screen overflow-hidden" >
//       {/* Three.js background */}
//       <div ref={containerRef} className="absolute inset-0 -z-10" />

//       {/* Theme buttons */}
//       <div className="flex flex-wrap gap-6 p-10 justify-center items-center h-full overflow-y-auto">
//         {THEMES.map((t) => {
//           const active = theme === t;
//           return (
//             <div key={t} className="flex flex-col items-center">
//               <button
//                 className={`theme-btn relative overflow-hidden cursor-pointer
//                   w-16 h-16 rounded-full border-4 shadow-lg transition-transform duration-300
//                   text-primary ${
//                     active ? "scale-110 ring-4 ring-primary" : "hover:scale-105"
//                   }`}
//                 data-theme={t}
//                 onMouseEnter={(e) =>
//                   gsap.to(e.currentTarget, {
//                     scale: active ? 1.15 : 1.1,
//                     rotate: 4,
//                     duration: 0.2,
//                     ease: "power3.out",
//                   })
//                 }
//                 onMouseLeave={(e) =>
//                   gsap.to(e.currentTarget, {
//                     scale: active ? 1.1 : 1,
//                     rotate: 0,
//                     duration: 0.25,
//                     ease: "power3.inOut",
//                   })
//                 }
//                 onClick={(e) => {
//                   // theme first so the ripple color uses the right palette
//                   setTheme(t);
//                   clickBurst(e.currentTarget);
//                   spawnRipple(e);
//                 }}
//               >
//                 <div
//                   className="w-full h-full rounded-full bg-base-100 flex items-center justify-center"
//                   data-theme={t}
//                 >
//                   <span className="text-xs font-bold select-none">
//                     {t.slice(0, 2)}
//                   </span>
//                 </div>
//               </button>
//               <span className="mt-2 text-xs capitalize">{t}</span>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// export default SettingsPage;


import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import * as THREE from "three";
import { useThemeStore } from "../store/useThemeStore";
import { THEMES } from "../constants";

// The preview component from your initial code is not needed for the theme animation,
// so it is removed to keep the code focused.

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();
  const containerRef = useRef(null);
  const webglRef = useRef(null);
  const webglColor = useRef(new THREE.Color(0x9f7aea)); // Initial color for the 3D object

  // Stagger-in on mount animation for the buttons
  useEffect(() => {
    gsap.fromTo(
      ".theme-btn",
      { opacity: 0, y: 32, scale: 0.8, rotate: -6 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        rotate: 0,
        duration: 0.5,
        stagger: 0.03,
        ease: "back.out(1.6)",
      }
    );
  }, []);

  // GSAP helper for the button click effect (scale, rotation, and pop)
  const clickBurst = (el) => {
    const tl = gsap.timeline();
    tl.to(el, { scale: 1.1, duration: 0.12, ease: "power2.out" })
      .to(el, { scale: 1, duration: 0.35, ease: "elastic.out(1, 0.4)" }, 0.12)
      .fromTo(
        el,
        { boxShadow: "0 0 0px rgba(0,0,0,0)" },
        {
          boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          duration: 0.25,
          ease: "power2.out",
        },
        0
      )
      .to(
        el,
        {
          boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
          duration: 0.35,
          ease: "power2.inOut",
        },
        0.2
      );
  };

  // GSAP helper for the ripple effect on click
  const spawnRipple = (e) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const d = Math.max(rect.width, rect.height);

    const ripple = document.createElement("span");
    Object.assign(ripple.style, {
      position: "absolute",
      left: `${e.clientX - rect.left - d / 2}px`,
      top: `${e.clientY - rect.top - d / 2}px`,
      width: `${d}px`,
      height: `${d}px`,
      borderRadius: "9999px",
      // Set the color dynamically from CSS custom properties for theme-matching
      background: "var(--p)", 
      opacity: "0.25",
      pointerEvents: "none",
      transform: "scale(0)",
      mixBlendMode: "screen",
      filter: "blur(1px)",
    });

    btn.appendChild(ripple);
    gsap.to(ripple, {
      scale: 2.6,
      opacity: 0,
      duration: 0.6,
      ease: "power2.out",
      onComplete: () => ripple.remove(),
    });
  };

  // Three.js animated background with theme-based color transition
  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    if (!webglRef.current) {
      containerRef.current.appendChild(renderer.domElement);
      webglRef.current = renderer.domElement;
    }

    const geometry = new THREE.TorusKnotGeometry(8, 3, 220, 36);
    const material = new THREE.MeshStandardMaterial({
      color: webglColor.current,
      wireframe: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const light = new THREE.PointLight(0xffffff, 1.4);
    light.position.set(25, 25, 25);
    scene.add(light);

    camera.position.z = 30;

    let rafId;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      mesh.rotation.x += 0.0045;
      mesh.rotation.y += 0.009;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      if (webglRef.current && webglRef.current.parentNode) {
        webglRef.current.parentNode.removeChild(webglRef.current);
      }
      webglRef.current = null;
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  // Update Three.js object color on theme change
  useEffect(() => {
    const root = document.documentElement;
    const newPrimaryColor = window.getComputedStyle(root).getPropertyValue("--p");
    
    if (newPrimaryColor) {
      // Get the current color of the 3D mesh and convert it to a Hex value
      const currentColorHex = material.color.getHex();
      const newColor = new THREE.Color(newPrimaryColor);

      // Animate the color transition using GSAP
      gsap.to(webglColor.current, {
        r: newColor.r,
        g: newColor.g,
        b: newColor.b,
        duration: 0.8,
        ease: "power2.inOut",
        onUpdate: () => {
          if (webglRef.current) {
             // Access the mesh and material from the current scene to update the color
             const mesh = webglRef.current.__threeObject.children[0];
             mesh.material.color.copy(webglColor.current);
          }
        },
      });
    }
  }, [theme]);

  return (
    <div className="relative w-full min-h-screen flex flex-col justify-center items-center overflow-hidden">
      {/* Three.js background canvas container */}
      <div ref={containerRef} className="absolute inset-0 -z-10" />

      {/* Main content container with margin-top for spacing */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 mt-20 md:mt-0 lg:mt-0">
        <div className="flex flex-col gap-1 text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Choose Your Theme 🎨
          </h1>
          <p className="text-lg text-base-content/70 mt-2">
            Select a theme to change the look and feel of your chat interface.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-6 p-6 md:p-10 justify-center items-center backdrop-blur-md rounded-2xl bg-base-100/30 border border-base-200 shadow-xl">
          {THEMES.map((t) => {
            const active = theme === t;
            return (
              <div key={t} className="flex flex-col items-center">
                <button
                  className={`theme-btn relative overflow-hidden cursor-pointer
                    w-20 h-20 rounded-full border-4 shadow-lg transition-transform duration-300
                    ${active ? "ring-4 ring-primary" : "border-base-content/10 hover:border-primary/50"}
                    `}
                  data-theme={t}
                  onMouseEnter={(e) =>
                    gsap.to(e.currentTarget, {
                      scale: active ? 1.15 : 1.1,
                      rotate: 4,
                      duration: 0.2,
                      ease: "power3.out",
                    })
                  }
                  onMouseLeave={(e) =>
                    gsap.to(e.currentTarget, {
                      scale: active ? 1.1 : 1,
                      rotate: 0,
                      duration: 0.25,
                      ease: "power3.inOut",
                    })
                  }
                  onClick={(e) => {
                    setTheme(t);
                    clickBurst(e.currentTarget);
                    spawnRipple(e);
                  }}
                >
                  <div
                    className="w-full h-full rounded-full flex items-center justify-center"
                    data-theme={t}
                  >
                    <span className="text-sm font-extrabold select-none p-2 bg-base-100/90 rounded-full text-base-content">
                      {t.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                </button>
                <span className="mt-2 text-sm capitalize font-medium text-base-content/80">
                  {t}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;