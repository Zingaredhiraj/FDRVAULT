'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function LiquidityBarsScene({ months = [] }) {
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

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 240;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 3, 7);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xff9933, 1.5);
    dirLight.position.set(2, 6, 4);
    scene.add(dirLight);

    // 12 3D Columns
    const barGroup = new THREE.Group();
    const count = 12;
    const spacing = 0.45;
    const startX = -((count - 1) * spacing) / 2;

    const colors = [
      0xef4444, // Red
      0xf97316, // Orange
      0xf59e0b, // Amber
      0x10b981, // Emerald
      0x10b981,
      0x10b981,
      0x10b981,
      0x10b981,
      0x10b981,
      0x10b981,
      0x10b981,
      0x10b981,
    ];

    const bars = [];
    for (let i = 0; i < count; i++) {
      const h = 0.5 + Math.random() * 1.8;
      const geo = new THREE.BoxGeometry(0.28, h, 0.28);
      const mat = new THREE.MeshStandardMaterial({
        color: colors[i],
        roughness: 0.3,
        metalness: 0.5,
      });
      const bar = new THREE.Mesh(geo, mat);
      bar.position.set(startX + i * spacing, h / 2 - 1, 0);
      barGroup.add(bar);
      bars.push({ mesh: bar, targetH: h });
    }

    scene.add(barGroup);

    let animId;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      barGroup.rotation.y = Math.sin(elapsed * 0.5) * 0.15;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const w = container.clientWidth || 600;
      const h = container.clientHeight || 240;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      bars.forEach((b) => {
        b.mesh.geometry.dispose();
        b.mesh.material.dispose();
      });
    };
  }, [months]);

  if (!webGLSupported) {
    return <div className="w-full h-48 bg-gradient-to-r from-red-500/20 via-amber-500/20 to-emerald-500/20 rounded-xl" />;
  }

  return <div ref={mountRef} className="w-full h-48 flex items-center justify-center" />;
}
