'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function ReleaseSealScene({ onComplete }) {
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

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 200;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 4.5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xff9933, 2);
    dirLight.position.set(2, 4, 3);
    scene.add(dirLight);

    // AICTE Official Release Seal Ring
    const sealGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.15, 32);
    const sealMat = new THREE.MeshStandardMaterial({
      color: 0x10b981, // Emerald green released seal
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x059669,
      emissiveIntensity: 0.4,
    });
    const seal = new THREE.Mesh(sealGeo, sealMat);
    seal.rotation.x = Math.PI / 2.5;
    seal.position.y = 3; // Starts high up, stamps down
    scene.add(seal);

    // Particle Burst on Stamp
    const particleCount = 60;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      velocities.push(
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1,
        Math.random() * 0.1
      );
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xff9933,
      size: 0.08,
      transparent: true,
      opacity: 0,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    let animId;
    let stamped = false;
    let startTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = (performance.now() - startTime) / 1000;

      // Stamp down animation
      if (seal.position.y > 0) {
        seal.position.y -= 0.12;
      } else if (!stamped) {
        stamped = true;
        particleMat.opacity = 1;
        if (onComplete) onComplete();
      }

      if (stamped && particleMat.opacity > 0) {
        particleMat.opacity -= 0.02;
        const pos = particleGeo.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
          pos[i * 3] += velocities[i * 3];
          pos[i * 3 + 1] += velocities[i * 3 + 1];
          pos[i * 3 + 2] += velocities[i * 3 + 2];
        }
        particleGeo.attributes.position.needsUpdate = true;
      }

      seal.rotation.z += 0.01;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      sealGeo.dispose();
      sealMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    };
  }, [onComplete]);

  if (!webGLSupported) {
    return (
      <div className="w-full h-32 flex items-center justify-center text-emerald-600 font-bold text-sm">
        ✓ Release Verified & Sealed
      </div>
    );
  }

  return <div ref={mountRef} className="w-full h-32 flex items-center justify-center" />;
}
