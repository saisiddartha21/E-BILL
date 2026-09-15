"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Maximize2, Minimize2, RotateCcw, Box, Activity, Eye, Layers } from "lucide-react";
import { spatialSound } from "@/lib/spatial-sound";
import { formatCurrency } from "@/lib/utils";

interface Dashboard3DCommandDeckProps {
  data: {
    todaySales?: number;
    monthlySales?: number;
    monthlyPurchases?: number;
    totalOutstanding?: number;
    totalProducts?: number;
    lowStockCount?: number;
  };
}

export function Dashboard3DCommandDeck({ data }: Dashboard3DCommandDeckProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activePreset, setActivePreset] = useState<"overview" | "warehouse" | "cashflow">("overview");
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>("sales");

  // References for Three.js state
  const sceneRef = useRef<{
    camera: THREE.PerspectiveCamera;
    controls: { targetX: number; targetY: number; targetZ: number };
  } | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a1628, 0.025);

    const camera = new THREE.PerspectiveCamera(
      50,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 7, 16);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Camera target
    const targetPos = new THREE.Vector3(0, 0, 0);
    const cameraTargetPos = new THREE.Vector3(0, 7, 16);

    sceneRef.current = {
      camera,
      controls: { targetX: 0, targetY: 7, targetZ: 16 },
    };

    // Lights
    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.5);
    scene.add(ambientLight);

    const coreLight = new THREE.PointLight(0x38bdf8, 3.5, 30);
    coreLight.position.set(0, 2, 0);
    scene.add(coreLight);

    const goldLight = new THREE.PointLight(0xf59e0b, 3, 30);
    goldLight.position.set(6, 4, 6);
    scene.add(goldLight);

    const emeraldLight = new THREE.PointLight(0x10b981, 2.5, 30);
    emeraldLight.position.set(-6, 3, -4);
    scene.add(emeraldLight);

    // 3D Grid Floor
    const gridHelper = new THREE.GridHelper(30, 30, 0x38bdf8, 0x1e293b);
    gridHelper.position.y = -2;
    scene.add(gridHelper);

    // Central Commercial Core (Floating crystal)
    const coreGeo = new THREE.OctahedronGeometry(1.6, 1);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      metalness: 0.9,
      roughness: 0.1,
      clearcoat: 1.0,
      transmission: 0.6,
      opacity: 0.9,
      transparent: true,
      wireframe: false,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.y = 1;
    scene.add(coreMesh);

    // Surrounding data rings
    const ringGeo = new THREE.RingGeometry(3.2, 3.3, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.8;
    scene.add(ringMesh);

    const outerRingGeo = new THREE.RingGeometry(5.8, 5.9, 64);
    const outerRingMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide });
    const outerRingMesh = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRingMesh.rotation.x = Math.PI / 2;
    outerRingMesh.position.y = 0.5;
    scene.add(outerRingMesh);

    // Orbiting 3D Metric Nodes (Representing Sales, Purchases, Stock, Balance)
    const nodeGroup = new THREE.Group();
    scene.add(nodeGroup);

    const nodesData = [
      { name: "sales", color: 0x38bdf8, radius: 4.2, speed: 0.6, angle: 0, label: "Sales" },
      { name: "purchases", color: 0xf59e0b, radius: 4.2, speed: 0.6, angle: Math.PI / 2, label: "Purchases" },
      { name: "outstanding", color: 0xf43f5e, radius: 4.2, speed: 0.6, angle: Math.PI, label: "Receivables" },
      { name: "stock", color: 0x10b981, radius: 4.2, speed: 0.6, angle: (3 * Math.PI) / 2, label: "Inventory" },
    ];

    const nodeMeshes: { mesh: THREE.Mesh; data: typeof nodesData[0] }[] = [];

    nodesData.forEach((item) => {
      const geo = new THREE.SphereGeometry(0.55, 32, 32);
      const mat = new THREE.MeshPhysicalMaterial({
        color: item.color,
        emissive: item.color,
        emissiveIntensity: 0.35,
        metalness: 0.8,
        roughness: 0.2,
      });
      const node = new THREE.Mesh(geo, mat);
      node.position.set(
        Math.cos(item.angle) * item.radius,
        1,
        Math.sin(item.angle) * item.radius
      );
      nodeGroup.add(node);
      nodeMeshes.push({ mesh: node, data: item });
    });

    // 3D Warehouse & Pipe Grid (Industrial plumbing business representation)
    const warehouseGroup = new THREE.Group();
    scene.add(warehouseGroup);

    // Decorative 3D Pipe Network
    const pipeMaterial = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.95,
      roughness: 0.25,
    });

    const pipe1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 8, 16), pipeMaterial);
    pipe1.rotation.z = Math.PI / 2;
    pipe1.position.set(0, -1, -5);
    warehouseGroup.add(pipe1);

    const pipe2 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 8, 16), pipeMaterial);
    pipe2.rotation.x = Math.PI / 2;
    pipe2.position.set(-4, -1, -1);
    warehouseGroup.add(pipe2);

    // Floating Storage Pallets / Cylinders
    for (let i = 0; i < 6; i++) {
      const x = -8 + (i % 3) * 3;
      const z = -4 - Math.floor(i / 3) * 3;
      const stackGeo = new THREE.BoxGeometry(1.4, 0.4, 1.4);
      const stackMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.6 });
      const stack = new THREE.Mesh(stackGeo, stackMat);
      stack.position.set(x, -1.8, z);
      warehouseGroup.add(stack);

      // Vertical pipe bundle
      const bundle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 1.6, 12),
        pipeMaterial
      );
      bundle.position.set(x, -0.8, z);
      warehouseGroup.add(bundle);
    }

    // Interactive Drag to Rotate
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let rotationVelocity = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      rotationVelocity.x = deltaX * 0.005;
      rotationVelocity.y = deltaY * 0.005;

      nodeGroup.rotation.y += deltaX * 0.006;
      warehouseGroup.rotation.y += deltaX * 0.006;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    mount.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    // Resize
    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    // Animation Loop
    let frameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Smooth camera interpolation towards cameraTargetPos
      camera.position.lerp(cameraTargetPos, 0.05);
      camera.lookAt(targetPos);

      // Core rotation & float
      coreMesh.rotation.y = time * 0.5;
      coreMesh.rotation.x = Math.sin(time * 0.5) * 0.2;
      coreMesh.position.y = 1 + Math.sin(time * 1.5) * 0.15;

      ringMesh.rotation.z = time * 0.2;
      outerRingMesh.rotation.z = -time * 0.15;

      // Orbit nodes
      if (!isDragging) {
        nodeMeshes.forEach((item) => {
          const currentAngle = item.data.angle + time * item.data.speed * 0.4;
          item.mesh.position.x = Math.cos(currentAngle) * item.data.radius;
          item.mesh.position.z = Math.sin(currentAngle) * item.data.radius;
          item.mesh.position.y = 1 + Math.sin(time * 2 + item.data.angle) * 0.2;
        });

        // Continuous gentle rotation
        nodeGroup.rotation.y += 0.002;
        warehouseGroup.rotation.y += 0.001;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      mount.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frameId);

      coreGeo.dispose();
      coreMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      outerRingGeo.dispose();
      outerRingMat.dispose();
      gridHelper.dispose();

      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Handle Camera Presets
  const setPreset = (preset: "overview" | "warehouse" | "cashflow") => {
    setActivePreset(preset);
    spatialSound.playSelect();

    if (!sceneRef.current) return;
    const { camera } = sceneRef.current;

    if (preset === "overview") {
      camera.position.set(0, 7, 16);
    } else if (preset === "warehouse") {
      camera.position.set(-8, 5, 8);
    } else if (preset === "cashflow") {
      camera.position.set(6, 8, 12);
    }
  };

  return (
    <div className={`relative w-full rounded-2xl border border-white/20 bg-gradient-to-b from-[#0a1628]/95 to-[#070e1e]/98 backdrop-blur-2xl shadow-2xl transition-all duration-500 overflow-hidden ${isExpanded ? "h-[540px]" : "h-[360px]"}`}>
      {/* 3D WebGL Canvas */}
      <div
        ref={mountRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
      />

      {/* Top HUD Controls */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="flex items-center gap-2 rounded-full bg-slate-900/80 px-3.5 py-1.5 border border-cyan-500/30 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-semibold tracking-wider text-cyan-300">
              3D COMMAND DECK
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-md border border-slate-700/40">
            <span>ORBIT: DRAG TO ROTATE</span>
          </div>
        </div>

        {/* Action Preset Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setPreset("overview")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activePreset === "overview"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-glow-cyan"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 border border-slate-700/50"
            }`}
          >
            <Activity size={13} />
            Overview
          </button>

          <button
            onClick={() => setPreset("warehouse")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activePreset === "warehouse"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-glow-gold"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 border border-slate-700/50"
            }`}
          >
            <Box size={13} />
            Warehouse Grid
          </button>

          <button
            onClick={() => setPreset("cashflow")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activePreset === "cashflow"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-glow-emerald"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 border border-slate-700/50"
            }`}
          >
            <Layers size={13} />
            Cashflow View
          </button>

          <button
            onClick={() => {
              setIsExpanded(!isExpanded);
              spatialSound.playSelect();
            }}
            className="p-1.5 rounded-lg bg-slate-800/60 text-slate-300 hover:bg-slate-800 border border-slate-700/50 transition-colors"
            title={isExpanded ? "Collapse View" : "Expand 3D View"}
          >
            {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* Floating 3D Metric Hologram Nodes */}
      <div className="absolute bottom-4 left-4 right-4 grid grid-cols-2 sm:grid-cols-4 gap-3 pointer-events-none z-20">
        <div
          onClick={() => {
            setSelectedNode("sales");
            spatialSound.playSelect();
          }}
          className={`pointer-events-auto cursor-pointer rounded-xl border p-3 backdrop-blur-xl transition-all duration-300 ${
            selectedNode === "sales"
              ? "border-cyan-500/60 bg-cyan-950/40 shadow-glow-cyan"
              : "border-slate-800/70 bg-slate-900/60 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-cyan-300">Sales Core</span>
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
          </div>
          <p className="mt-1 text-lg font-bold text-white tracking-tight">
            {formatCurrency(data.todaySales || 0)}
          </p>
          <p className="text-[11px] text-slate-400">Live transaction stream</p>
        </div>

        <div
          onClick={() => {
            setSelectedNode("purchases");
            spatialSound.playSelect();
          }}
          className={`pointer-events-auto cursor-pointer rounded-xl border p-3 backdrop-blur-xl transition-all duration-300 ${
            selectedNode === "purchases"
              ? "border-amber-500/60 bg-amber-950/40 shadow-glow-gold"
              : "border-slate-800/70 bg-slate-900/60 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-300">Monthly Purchases</span>
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          </div>
          <p className="mt-1 text-lg font-bold text-white tracking-tight">
            {formatCurrency(data.monthlyPurchases || 0)}
          </p>
          <p className="text-[11px] text-slate-400">Stock procurement</p>
        </div>

        <div
          onClick={() => {
            setSelectedNode("outstanding");
            spatialSound.playSelect();
          }}
          className={`pointer-events-auto cursor-pointer rounded-xl border p-3 backdrop-blur-xl transition-all duration-300 ${
            selectedNode === "outstanding"
              ? "border-rose-500/60 bg-rose-950/40 shadow-glow-purple"
              : "border-slate-800/70 bg-slate-900/60 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-300">Outstanding</span>
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
          </div>
          <p className="mt-1 text-lg font-bold text-white tracking-tight">
            {formatCurrency(data.totalOutstanding || 0)}
          </p>
          <p className="text-[11px] text-slate-400">Receivable balances</p>
        </div>

        <div
          onClick={() => {
            setSelectedNode("stock");
            spatialSound.playSelect();
          }}
          className={`pointer-events-auto cursor-pointer rounded-xl border p-3 backdrop-blur-xl transition-all duration-300 ${
            selectedNode === "stock"
              ? "border-emerald-500/60 bg-emerald-950/40 shadow-glow-emerald"
              : "border-slate-800/70 bg-slate-900/60 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-300">Inventory Units</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </div>
          <p className="mt-1 text-lg font-bold text-white tracking-tight">
            {data.totalProducts || 0} Products
          </p>
          <p className="text-[11px] text-slate-400">
            {data.lowStockCount ? `${data.lowStockCount} alerts` : "Levels optimal"}
          </p>
        </div>
      </div>
    </div>
  );
}
