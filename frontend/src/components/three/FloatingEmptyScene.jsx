'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function FloatingEmptyScene() {
  const mountRef = useRef(null);
  const [webGLSupported, setWebGLSupported] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGLSupported(false);
        return;
      }
    } catch {
      setWebGLSupported(false);
      return;
    }

    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 240;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xff9933, 1.2, 20);
    pointLight.position.set(2, 3, 4);
    scene.add(pointLight);

    // Floating Low-Poly Geometries (Octahedron, Icosahedron, Torus)
    const geometries = [
      new THREE.OctahedronGeometry(0.5, 0),
      new THREE.IcosahedronGeometry(0.4, 0),
      new THREE.TorusGeometry(0.35, 0.1, 8, 16),
      new THREE.TetrahedronGeometry(0.45, 0),
    ];

    const materials = [
      new THREE.MeshStandardMaterial({ color: 0x0b1f4b, roughness: 0.4 }),
      new THREE.MeshStandardMaterial({ color: 0xff9933, roughness: 0.3 }),
      new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.5 }),
      new THREE.MeshStandardMaterial({ color: 0x6366f1, roughness: 0.4 }),
    ];

    const meshes = [];
    const offsets = [
      { x: -1.2, y: 0.2, z: 0, speed: 1.2 },
      { x: 1.1, y: -0.3, z: 0.2, speed: 0.9 },
      { x: 0.2, y: 0.8, z: -0.5, speed: 1.5 },
      { x: -0.3, y: -0.7, z: 0.4, speed: 1.1 },
    ];

    for (let i = 0; i < 4; i++) {
      const mesh = new THREE.Mesh(geometries[i], materials[i]);
      mesh.position.set(offsets[i].x, offsets[i].y, offsets[i].z);
      scene.add(mesh);
      meshes.push({ mesh, ...offsets[i] });
    }

    let animId;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      meshes.forEach((item, idx) => {
        item.mesh.position.y = item.y + Math.sin(elapsed * item.speed + idx) * 0.15;
        item.mesh.rotation.x += 0.01;
        item.mesh.rotation.y += 0.012;
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    };
  }, []);

  if (!webGLSupported) {
    return (
      <div className="w-full h-48 flex items-center justify-center text-slate-400 text-xs">
        [Empty State Visualizer]
      </div>
    );
  }

  return <div ref={mountRef} className="w-full h-48 flex items-center justify-center" />;
}
