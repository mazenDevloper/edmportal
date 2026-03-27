import type { ComponentType } from 'react';

export type Vec3 = { x: number; y: number; z: number };

export type WindowContent = {
  id: string;
  title: string;
  component: ComponentType<any>;
  summary: string;
  defaultSize: { width: number, height: number }
};

export type SpatialWindow = {
  id: string;
  contentId: string;
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
};
