"use client";

import { useEffect } from 'react';
import * as THREE from 'three';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type SkyboxProps = {
  scene: THREE.Scene;
  onReady: () => void;
};

const Skybox = ({ scene, onReady }: SkyboxProps) => {
  useEffect(() => {
    let isMounted = true;
    const bgImage = PlaceHolderImages.find(img => img.id === '360-background');
    if (bgImage) {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(bgImage.imageUrl, (texture) => {
        if (!isMounted) return;
        texture.mapping = THREE.EquirectangularReflectionMapping;
        const bgSphere = new THREE.Mesh(
          new THREE.SphereGeometry(500, 60, 40),
          new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide })
        );
        scene.add(bgSphere);
        onReady();
      },
      undefined,
      (error) => {
        if (!isMounted) return;
        console.error('An error occurred loading the texture.', error);
        onReady();
      });
    } else {
        onReady();
    }
    return () => { isMounted = false; }
  }, [scene, onReady]);

  return null;
};

export default Skybox;
