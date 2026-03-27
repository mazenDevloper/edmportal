"use client";

import { useEffect } from 'react';
import * as THREE from 'three';

const Lighting = ({ scene }: { scene: THREE.Scene }) => {
  useEffect(() => {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    return () => {
      scene.remove(ambientLight);
      scene.remove(directionalLight);
    };
  }, [scene]);

  return null;
};

export default Lighting;
