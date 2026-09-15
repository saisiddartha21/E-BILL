"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface ThreeBackgroundProps {
  className?: string;
  particleCount?: number;
  interactive?: boolean;
}

export function ThreeBackground({
  className = "",
  particleCount = 120,
  interactive = true,
}: ThreeBackgroundProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Scene Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 24;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Ambient & Directional Lights
    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.8);
    scene.add(ambientLight);

    const cyanLight = new THREE.PointLight(0x06b6d4, 3, 45);
    cyanLight.position.set(10, 10, 12);
    scene.add(cyanLight);

    const goldLight = new THREE.PointLight(0xf59e0b, 2.5, 45);
    goldLight.position.set(-10, -10, 12);
    scene.add(goldLight);

    const blueLight = new THREE.PointLight(0x3b82f6, 2, 40);
    blueLight.position.set(0, 15, 8);
    scene.add(blueLight);

    // Floating Geometric 3D Objects
    const group = new THREE.Group();
    scene.add(group);

    const geometries = [
      new THREE.IcosahedronGeometry(0.9, 0),
      new THREE.TorusGeometry(1.2, 0.28, 16, 32),
      new THREE.OctahedronGeometry(1.1, 0),
      new THREE.CylinderGeometry(0.3, 0.3, 1.8, 16),
      new THREE.TorusKnotGeometry(0.8, 0.22, 64, 8),
    ];

    const materials = [
      new THREE.MeshPhysicalMaterial({
        color: 0x1e3a8a,
        metalness: 0.85,
        roughness: 0.2,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        wireframe: false,
        transparent: true,
        opacity: 0.85,
      }),
      new THREE.MeshPhysicalMaterial({
        color: 0xd97706,
        metalness: 0.9,
        roughness: 0.25,
        clearcoat: 0.8,
        transparent: true,
        opacity: 0.85,
      }),
      new THREE.MeshPhysicalMaterial({
        color: 0x0284c7,
        metalness: 0.7,
        roughness: 0.15,
        clearcoat: 1.0,
        wireframe: true,
      }),
    ];

    const meshCount = 18;
    const meshes: { mesh: THREE.Mesh; rotSpeed: { x: number; y: number; z: number }; origY: number; floatOffset: number }[] = [];

    for (let i = 0; i < meshCount; i++) {
      const geom = geometries[i % geometries.length];
      const mat = materials[i % materials.length];
      const mesh = new THREE.Mesh(geom, mat);

      const x = (Math.random() - 0.5) * 40;
      const y = (Math.random() - 0.5) * 26;
      const z = (Math.random() - 0.5) * 20 - 4;

      mesh.position.set(x, y, z);
      const scale = 0.5 + Math.random() * 0.9;
      mesh.scale.set(scale, scale, scale);

      group.add(mesh);
      meshes.push({
        mesh,
        rotSpeed: {
          x: (Math.random() - 0.5) * 0.015,
          y: (Math.random() - 0.5) * 0.015,
          z: (Math.random() - 0.5) * 0.015,
        },
        origY: y,
        floatOffset: Math.random() * Math.PI * 2,
      });
    }

    // Particle Cloud
    const particlesGeo = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    const colorArray = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 50;
      posArray[i + 1] = (Math.random() - 0.5) * 35;
      posArray[i + 2] = (Math.random() - 0.5) * 30;

      // Color variation (cyan to gold)
      const mix = Math.random();
      colorArray[i] = mix > 0.5 ? 0.02 : 0.95; // r
      colorArray[i + 1] = mix > 0.5 ? 0.71 : 0.62; // g
      colorArray[i + 2] = mix > 0.5 ? 0.83 : 0.04; // b
    }

    particlesGeo.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
    particlesGeo.setAttribute("color", new THREE.BufferAttribute(colorArray, 3));

    const particlesMat = new THREE.PointsMaterial({
      size: 0.16,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particles);

    // Mouse Tracking for Parallax
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };

    window.addEventListener("resize", handleResize);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Lerp mouse
      currentMouseX += (targetMouseX - currentMouseX) * 0.05;
      currentMouseY += (targetMouseY - currentMouseY) * 0.05;

      camera.position.x = currentMouseX * 3;
      camera.position.y = -currentMouseY * 3;
      camera.lookAt(0, 0, 0);

      // Light orbit
      cyanLight.position.x = Math.sin(elapsedTime * 0.5) * 12 + currentMouseX * 5;
      cyanLight.position.y = Math.cos(elapsedTime * 0.5) * 12 - currentMouseY * 5;

      goldLight.position.x = -Math.sin(elapsedTime * 0.4) * 14;
      goldLight.position.y = -Math.cos(elapsedTime * 0.4) * 14;

      // Animate meshes
      meshes.forEach((item, index) => {
        item.mesh.rotation.x += item.rotSpeed.x;
        item.mesh.rotation.y += item.rotSpeed.y;
        item.mesh.position.y = item.origY + Math.sin(elapsedTime + item.floatOffset) * 0.8;
      });

      // Slowly rotate particle field
      particles.rotation.y = elapsedTime * 0.03;
      particles.rotation.x = elapsedTime * 0.015;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);

      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      particlesGeo.dispose();
      particlesMat.dispose();

      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [particleCount, interactive]);

  return (
    <div
      ref={mountRef}
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{ zIndex: 0 }}
    />
  );
}
