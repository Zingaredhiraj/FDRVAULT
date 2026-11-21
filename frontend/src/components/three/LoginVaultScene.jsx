'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function LoginVaultScene({ isSuccess, isFailure }) {
  const mountRef = useRef(null);
  const [webGLSupported, setWebGLSupported] = useState(true);

  useEffect(() => {
    // Check WebGL availability
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

    // Dimensions
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#07132e'); // Deep Navy

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xff9933, 2, 50); // Saffron glow
    pointLight.position.set(0, 0, 4);
    scene.add(pointLight);

    // Vault Door: Outer Torus Ring
    const torusGeo = new THREE.TorusGeometry(2.5, 0.18, 16, 100);
    const torusMat = new THREE.MeshStandardMaterial({
      color: 0xff9933, // Saffron
      emissive: 0xff9933,
      emissiveIntensity: 0.35,
      metalness: 0.8,
      roughness: 0.2,
    });
    const outerRing = new THREE.Mesh(torusGeo, torusMat);
    scene.add(outerRing);

    // Inner Vault Cylinder Door
    const doorGeo = new THREE.CylinderGeometry(2.3, 2.3, 0.2, 32);
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x0b1f4b, // AICTE Navy
      metalness: 0.9,
      roughness: 0.3,
    });
    const vaultDoor = new THREE.Mesh(doorGeo, doorMat);
    vaultDoor.rotation.x = Math.PI / 2;
    scene.add(vaultDoor);

    // Subtle Particle Field (floating security dust)
    const particleCount = 150;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 16;
      positions[i + 1] = (Math.random() - 0.5) * 16;
      positions[i + 2] = (Math.random() - 0.5) * 10;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xff9933,
      size: 0.05,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Mouse parallax
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    let animId;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Gentle rotation
      outerRing.rotation.z = elapsed * 0.15;
      particles.rotation.y = elapsed * 0.05;

      // Parallax camera lerp
      camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.05;
      camera.position.y += (mouseY * 0.5 - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      // Handle Success (open vault) or Failure (shake)
      if (isSuccess) {
        vaultDoor.rotation.y = THREE.MathUtils.lerp(vaultDoor.rotation.y, Math.PI / 2.5, 0.05);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, 4, 0.05);
      } else if (isFailure) {
        camera.position.x += Math.sin(elapsed * 40) * 0.1;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      torusGeo.dispose();
      torusMat.dispose();
      doorGeo.dispose();
      doorMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    };
  }, [isSuccess, isFailure]);

  if (!webGLSupported) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-[#07132e] via-[#0b1f4b] to-[#040a1a] opacity-90 -z-10" />
    );
  }

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 pointer-events-none -z-10 overflow-hidden"
      style={{ opacity: 0.85 }}
    />
  );
}
