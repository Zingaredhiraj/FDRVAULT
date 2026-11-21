'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function DepositGlobeScene({ stateData = [], onStateClick }) {
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

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 280;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.5, 4.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    container.appendChild(renderer.domElement);

    // Ambient & Directional Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xff9933, 1.2);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    // Globe Sphere (Wireframe + Core)
    const sphereGeo = new THREE.SphereGeometry(1.6, 24, 24);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x0b1f4b,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const globe = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(globe);

    const innerSphereGeo = new THREE.SphereGeometry(1.55, 32, 32);
    const innerSphereMat = new THREE.MeshStandardMaterial({
      color: 0x07132e,
      roughness: 0.8,
      metalness: 0.2,
    });
    const innerSphere = new THREE.Mesh(innerSphereGeo, innerSphereMat);
    globe.add(innerSphere);

    // State Pins on Globe
    const pinGroup = new THREE.Group();
    const pinGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8);
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xff9933, emissive: 0xff6600, emissiveIntensity: 0.5 });

    // Generate pins for sample state positions
    const pinPositions = [
      { lat: 28.6, lon: 77.2, state: 'Delhi' },
      { lat: 19.0, lon: 72.8, state: 'Maharashtra' },
      { lat: 13.0, lon: 80.2, state: 'Tamil Nadu' },
      { lat: 12.9, lon: 77.5, state: 'Karnataka' },
      { lat: 22.5, lon: 88.3, state: 'West Bengal' },
      { lat: 26.8, lon: 80.9, state: 'Uttar Pradesh' },
      { lat: 23.0, lon: 72.5, state: 'Gujarat' },
    ];

    pinPositions.forEach((pos) => {
      const phi = (90 - pos.lat) * (Math.PI / 180);
      const theta = (pos.lon + 180) * (Math.PI / 180);
      const radius = 1.6;

      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);

      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.set(x, y, z);
      pin.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(x, y, z).normalize());
      pin.userData = { state: pos.state };
      pinGroup.add(pin);
    });

    globe.add(pinGroup);

    // Animation loop
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      globe.rotation.y += 0.004;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const w = container.clientWidth || 400;
      const h = container.clientHeight || 280;
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
      sphereGeo.dispose();
      sphereMat.dispose();
      innerSphereGeo.dispose();
      innerSphereMat.dispose();
      pinGeo.dispose();
      pinMat.dispose();
    };
  }, [stateData, onStateClick]);

  if (!webGLSupported) {
    return (
      <div className="w-full h-64 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-[#0B1F4B] flex items-center justify-center text-xs text-indigo-300">
        Geo-spatial State Distribution (2D Fallback)
      </div>
    );
  }

  return <div ref={mountRef} className="w-full h-64 flex items-center justify-center cursor-grab" />;
}
