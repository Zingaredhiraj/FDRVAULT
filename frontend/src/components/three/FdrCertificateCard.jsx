'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function FdrCertificateCard({
  fdrNumber = 'FDR-2024-001',
  principal = '₹25,00,000',
  status = 'ACTIVE',
  riskGlow = 'emerald',
}) {
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

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 200;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.z = 4.2;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const glowColor =
      riskGlow === 'red' ? 0xef4444 : riskGlow === 'amber' ? 0xf59e0b : 0x10b981;
    const pointLight = new THREE.PointLight(glowColor, 2, 10);
    pointLight.position.set(0, 0, 2);
    scene.add(pointLight);

    // 3D Card
    const cardGeo = new THREE.BoxGeometry(2.6, 1.6, 0.08);
    const cardMat = new THREE.MeshStandardMaterial({
      color: 0x0b1f4b,
      metalness: 0.7,
      roughness: 0.3,
    });
    const card = new THREE.Mesh(cardGeo, cardMat);
    scene.add(card);

    // Torus Gauge inside card
    const torusGeo = new THREE.TorusGeometry(0.4, 0.04, 16, 50);
    const torusMat = new THREE.MeshStandardMaterial({
      color: glowColor,
      emissive: glowColor,
      emissiveIntensity: 0.5,
    });
    const torus = new THREE.Mesh(torusGeo, torusMat);
    torus.position.set(0.7, 0.3, 0.06);
    card.add(torus);

    // Tilt handling
    let targetRotX = 0;
    let targetRotY = 0;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotY = x * 0.35;
      targetRotX = -y * 0.35;
    };

    container.addEventListener('mousemove', handleMouseMove);

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      card.rotation.x += (targetRotX - card.rotation.x) * 0.1;
      card.rotation.y += (targetRotY - card.rotation.y) * 0.1;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      cardGeo.dispose();
      cardMat.dispose();
      torusGeo.dispose();
      torusMat.dispose();
    };
  }, [riskGlow]);

  if (!webGLSupported) {
    return (
      <div className="w-full h-48 bg-gradient-to-br from-[#0b1f4b] to-slate-900 rounded-2xl p-4 text-white shadow-lg">
        <p className="text-xs uppercase text-amber-400 font-bold">FDR Security Certificate</p>
        <p className="text-lg font-mono font-bold mt-2">{fdrNumber}</p>
        <p className="text-sm font-semibold text-emerald-400 mt-1">{principal}</p>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      className="w-full h-48 flex items-center justify-center cursor-pointer rounded-2xl overflow-hidden"
    />
  );
}
