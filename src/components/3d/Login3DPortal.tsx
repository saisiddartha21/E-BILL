"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export function Login3DPortal() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const goldPoint = new THREE.PointLight(0xf59e0b, 5, 20);
    goldPoint.position.set(5, 5, 5);
    scene.add(goldPoint);

    const cyanPoint = new THREE.PointLight(0x38bdf8, 4, 20);
    cyanPoint.position.set(-5, -4, 4);
    scene.add(cyanPoint);

    // Center 3D Object Group
    const portalGroup = new THREE.Group();
    scene.add(portalGroup);

    // Core Torus Knot (Plumbing & Industrial motif)
    const knotGeometry = new THREE.TorusKnotGeometry(1.6, 0.45, 128, 32, 2, 3);
    const knotMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xeab308, // Gold
      metalness: 0.9,
      roughness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      reflectivity: 1.0,
      wireframe: false,
    });
    const knotMesh = new THREE.Mesh(knotGeometry, knotMaterial);
    portalGroup.add(knotMesh);

    // Gyro Rings
    const ringGeo1 = new THREE.TorusGeometry(3.0, 0.06, 16, 100);
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.4,
      metalness: 0.8,
      roughness: 0.2,
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    portalGroup.add(ring1);

    const ringGeo2 = new THREE.TorusGeometry(3.6, 0.05, 16, 100);
    const ringMat2 = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.3,
      metalness: 0.8,
      roughness: 0.2,
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = Math.PI / 3;
    portalGroup.add(ring2);

    // Orbiting Particles Ring
    const particleCount = 150;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 2.4 + (Math.random() - 0.5) * 1.5;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.8;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x67e8f9,
      size: 0.08,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    portalGroup.add(particles);

    // Mouse Tracking
    let mouseX = 0;
    let mouseY = 0;
    const onMouseMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    window.addEventListener("mousemove", onMouseMove);

    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    let frameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      knotMesh.rotation.x = time * 0.4;
      knotMesh.rotation.y = time * 0.6;

      ring1.rotation.x = time * 0.3 + mouseY * 0.5;
      ring1.rotation.y = time * 0.5 + mouseX * 0.5;

      ring2.rotation.z = time * 0.25;
      ring2.rotation.y = -time * 0.4;

      particles.rotation.y = -time * 0.5;

      // Group subtle sway towards mouse
      portalGroup.rotation.x = mouseY * 0.3;
      portalGroup.rotation.y = mouseX * 0.4;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frameId);

      knotGeometry.dispose();
      knotMaterial.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      particleGeo.dispose();
      particleMat.dispose();

      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 h-full w-full pointer-events-none overflow-hidden"
    />
  );
}
