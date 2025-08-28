import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import * as THREE from "three";
import { useThemeStore } from "../store/useThemeStore";
import { THEMES } from "../constants";
import { toast } from "react-hot-toast";
import axiosInstance from "../lib/axios";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { LogOut } from "lucide-react";

// The preview component from your initial code is not needed for the theme animation,
// so it is removed to keep the code focused.

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();
  const containerRef = useRef(null);
  const webglRef = useRef(null);
  const webglColor = useRef(new THREE.Color(0x9f7aea)); // Initial color for the 3D object

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      setLoadingSessions(true);
      try {
        const res = await axiosInstance.get("/auth/sessions");
        setSessions(res.data);
      } catch (error) {
        toast.error(error.response?.data?.error || "Failed to fetch sessions.");
      } finally {
        setLoadingSessions(false);
      }
    };
    fetchSessions();
  }, []);

  const handleRevokeSession = async (sessionId) => {
    try {
      await axiosInstance.delete(`/auth/sessions/${sessionId}`);
      setSessions(sessions.filter((session) => session._id !== sessionId));
      toast.success("Session revoked successfully.");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to revoke session.");
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error("Please enter your password to confirm.");
      return;
    }
    try {
      await axiosInstance.delete("/auth/delete-account", {
        data: { currentPassword: deletePassword }, // DELETE requests with body require 'data' key
      });
      toast.success("Account deleted successfully.");
      logout(); // Clear auth state
      navigate("/login"); // Redirect to login
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete account.");
    } finally {
      setShowDeleteModal(false);
      setDeletePassword("");
    }
  };

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
    const newPrimaryColor = window
      .getComputedStyle(root)
      .getPropertyValue("--p");

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
                    ${
                      active
                        ? "ring-4 ring-primary"
                        : "border-base-content/10 hover:border-primary/50"
                    }
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

        {/* Active Sessions Section */}
        <div className="mt-12 p-6 md:p-10 backdrop-blur-md rounded-2xl bg-base-100/30 border border-base-200 shadow-xl text-center">
          <h2 className="text-2xl font-bold mb-4">Active Sessions</h2>
          {loadingSessions ? (
            <p>Loading sessions...</p>
          ) : sessions.length > 0 ? (
            <div className="space-y-4 text-left">
              {sessions.map((session) => (
                <div
                  key={session._id}
                  className="flex justify-between items-center bg-base-100 p-4 rounded-lg border border-base-300"
                >
                  <div>
                    <p className="font-medium">{session.userAgent}</p>
                    <p className="text-sm text-base-content/60">
                      Logged in: {format(new Date(session.createdAt), "PPP p")}
                    </p>
                  </div>
                  <button
                    className="btn btn-warning btn-sm gap-2"
                    onClick={() => handleRevokeSession(session._id)}
                  >
                    <LogOut className="size-4" /> Revoke
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-base-content/70">No active sessions found.</p>
          )}
        </div>

        {/* Account Deletion Section */}
        <div className="mt-12 p-6 md:p-10 backdrop-blur-md rounded-2xl bg-base-100/30 border border-base-200 shadow-xl text-center">
          <h2 className="text-2xl font-bold text-error mb-4">Danger Zone</h2>
          <p className="text-base-content/70 mb-6">
            Permanently delete your account and all associated data. This action
            cannot be undone.
          </p>
          <button
            className="btn btn-error btn-wide"
            onClick={() => setShowDeleteModal(true)}
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-base-200 rounded-lg p-6 w-full max-w-md space-y-4">
            <h3 className="font-bold text-lg text-error">
              Confirm Account Deletion
            </h3>
            <p>
              This action is irreversible. Please enter your password to confirm
              that you want to permanently delete your account.
            </p>
            <input
              type="password"
              placeholder="Your Password"
              className="input input-bordered w-full"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
            />
            <div className="modal-action flex justify-end gap-2">
              <button
                className="btn btn-outline"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button className="btn btn-error" onClick={handleDeleteAccount}>
                Delete My Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
