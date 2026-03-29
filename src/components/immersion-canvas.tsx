
"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import * as Tone from 'tone';
import gsap from 'gsap';
import { createRoot, type Root } from 'react-dom/client';

import { getAISuggestions } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useOSStore } from '@/lib/os-store';

import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { GlassInfoIcon, GlassMusicIcon, GlassSparklesIcon } from './icons';
import { WelcomeContent, MusicPlayerContent, AIHelperContent } from './window-contents';
import { Skeleton } from './ui/skeleton';
import SpatialWindow from './spatial-window';
import Skybox from './skybox';
import Lighting from './lighting';


const windowContents = [
  { id: 'welcome', title: 'Welcome', component: WelcomeContent, summary: 'A welcome screen with instructions.', defaultSize: { width: 500, height: 350 } },
  { id: 'music', title: 'Music Player', component: MusicPlayerContent, summary: 'A music player widget.', defaultSize: { width: 300, height: 200 } },
  { id: 'ai-helper', title: 'AI Assistant', component: AIHelperContent, summary: 'An interface to the AI spatial layout assistant.', defaultSize: { width: 400, height: 300 } },
];

export default function ImmersionCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { windows, addWindow, removeWindow, updateWindowTransform, setWindows, isWindowOpen } = useOSStore();
  const [isReady, setIsReady] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  const sceneElements = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    glRenderer: THREE.WebGLRenderer;
    cssRenderer: CSS3DRenderer;
    controls: OrbitControls;
    raycaster: THREE.Raycaster;
    pointer: THREE.Vector2;
    draggedObject: { id: string; offset: THREE.Vector3 } | null;
    objects: Map<string, { cssObject: CSS3DObject; reactRoot: Root; audioPlayer?: Tone.Player; panner?: Tone.Panner3D }>;
  }>();

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const handleRunAI = useCallback(async (taskDescription: string) => {
    if (!sceneElements.current) return;
    toast({ title: "AI Assistant is thinking...", description: "Organizing your workspace based on your task." });
    
    try {
      const input = {
        openWindows: windows.map(w => {
          const content = windowContents.find(c => c.id === w.contentId);
          return {
            id: w.id,
            contentSummary: content?.summary || 'Window content',
            currentPosition: w.position,
            currentRotation: w.rotation,
            currentScale: w.scale,
          };
        }),
        userContext: { currentTask: taskDescription },
        environmentProperties: {
          environmentType: 'abstract space',
          availableSpaceDescription: 'A large open spherical area around the user, with a radius of about 10 units.',
        },
      };

      const result = await getAISuggestions(input);
      
      toast({ title: "AI Layout Applied", description: result.overallReasoning });

      const newWindows = [...windows];
      result.suggestedLayout.forEach(suggestion => {
        const { id, suggestedPosition } = suggestion;
        const threeObject = sceneElements.current?.objects.get(id)?.cssObject;
        const windowIndex = newWindows.findIndex(w => w.id === id);

        if (threeObject && windowIndex !== -1) {
          gsap.to(threeObject.position, { ...suggestedPosition, duration: 1.5, ease: 'power3.inOut' });
          gsap.to(threeObject.rotation, { x:0, y:0, z:0, duration: 1.5, ease: 'power3.inOut' });
          
          newWindows[windowIndex] = { ...newWindows[windowIndex], position: suggestedPosition, rotation: {x:0, y:0, z:0} };
        }
      });
      setWindows(newWindows);

    } catch (e) {
      toast({ variant: "destructive", title: "AI Assistant Error", description: (e as Error).message });
    }
  }, [windows, toast, setWindows]);

  const handleAddWindow = useCallback((contentId: string) => {
    if (Tone.context.state !== 'running') {
      Tone.start();
    }
    const content = windowContents.find(c => c.id === contentId);
    if (!content) return;

    if (contentId === 'ai-helper' && isWindowOpen('ai-helper')) {
      toast({ title: "AI Assistant is already open." });
      return;
    }

    addWindow({
      contentId,
      position: { x: (Math.random() - 0.5) * 4, y: Math.random() * 2, z: -5 - Math.random() * 2 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    });
  }, [addWindow, toast, isWindowOpen]);

  // Three.js Initialization
  useEffect(() => {
    if (!isClient) return;

    const container = containerRef.current;
    if (!container || sceneElements.current) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 0.1;

    const glRenderer = new THREE.WebGLRenderer({ antialias: true });
    glRenderer.setSize(width, height);
    glRenderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(glRenderer.domElement);
    
    const cssRenderer = new CSS3DRenderer();
    cssRenderer.setSize(width, height);
    cssRenderer.domElement.style.position = 'absolute';
    cssRenderer.domElement.style.top = '0';
    container.appendChild(cssRenderer.domElement);

    const controls = new OrbitControls(camera, cssRenderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.rotateSpeed = -0.5;
    
    const raycaster = new THREE.Raycaster();
    
    sceneElements.current = {
      scene, camera, glRenderer, cssRenderer, controls, raycaster,
      pointer: new THREE.Vector2(),
      draggedObject: null,
      objects: new Map(),
    };
    
    const onPointerDown = (event: PointerEvent) => {
      if (!sceneElements.current) return;
      const { pointer, raycaster, camera, objects } = sceneElements.current;
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(Array.from(objects.values()).map(o => o.cssObject), true);
      
      if (intersects.length > 0) {
        const obj = intersects[0].object;
        const windowId = obj.userData.windowId;
        if(windowId && objects.has(windowId)) {
          const dragPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(
            camera.getWorldDirection(new THREE.Vector3()),
            obj.position
          );
          const intersectionPoint = new THREE.Vector3();
          raycaster.ray.intersectPlane(dragPlane, intersectionPoint);

          sceneElements.current.draggedObject = {
            id: windowId,
            offset: new THREE.Vector3().subVectors(obj.position, intersectionPoint),
          };
          if(sceneElements.current.controls) sceneElements.current.controls.enabled = false;
        }
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!sceneElements.current || !sceneElements.current.draggedObject) return;
      const { draggedObject, raycaster, camera, objects } = sceneElements.current;
      const { id } = draggedObject;
      const cssObject = objects.get(id)?.cssObject;
      if (!cssObject) return;

      const pointer = sceneElements.current.pointer;
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const dragPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(
        camera.getWorldDirection(new THREE.Vector3()),
        cssObject.position
      );
      const intersectionPoint = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(dragPlane, intersectionPoint)) {
        cssObject.position.addVectors(intersectionPoint, draggedObject.offset);
        cssObject.rotation.copy(camera.rotation);
      }
    };
    
    const onPointerUp = () => {
      if (!sceneElements.current || !sceneElements.current.draggedObject) return;
      const { id } = sceneElements.current.draggedObject;
      const cssObject = sceneElements.current.objects.get(id)?.cssObject;
      if (cssObject) {
        const { x: posX, y: posY, z: posZ } = cssObject.position;
        const { x: rotX, y: rotY, z: rotZ } = cssObject.rotation;
        updateWindowTransform(id, {x: posX, y: posY, z: posZ}, {x: rotX, y: rotY, z: rotZ});
      }
      sceneElements.current.draggedObject = null;
      if(sceneElements.current.controls) sceneElements.current.controls.enabled = true;
    };

    cssRenderer.domElement.addEventListener('pointerdown', onPointerDown);
    cssRenderer.domElement.addEventListener('pointermove', onPointerMove);
    cssRenderer.domElement.addEventListener('pointerup', onPointerUp);

    const animate = () => {
      requestAnimationFrame(animate);
      if(!sceneElements.current) return;
      const { controls, camera, glRenderer, cssRenderer, scene, objects } = sceneElements.current;
      
      controls.update();

      objects.forEach(obj => {
        if (obj.panner) {
          obj.panner.setPosition(obj.cssObject.position.x, obj.cssObject.position.y, obj.cssObject.position.z);
        }
      });
      const { x, y, z } = camera.position;
      Tone.Listener.positionX.rampTo(x, 0.1);
      Tone.Listener.positionY.rampTo(y, 0.1);
      Tone.Listener.positionZ.rampTo(z, 0.1);
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      Tone.Listener.forwardX.rampTo(forward.x, 0.1);
      Tone.Listener.forwardY.rampTo(forward.y, 0.1);
      Tone.Listener.forwardZ.rampTo(forward.z, 0.1);

      glRenderer.render(scene, camera);
      cssRenderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
        if(!sceneElements.current) return;
        const { camera, glRenderer, cssRenderer } = sceneElements.current;
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        glRenderer.setSize(w, h);
        cssRenderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      cssRenderer.domElement.removeEventListener('pointerdown', onPointerDown);
      cssRenderer.domElement.removeEventListener('pointermove', onPointerMove);
      cssRenderer.domElement.removeEventListener('pointerup', onPointerUp);
      if (sceneElements.current) {
        sceneElements.current.objects.forEach(obj => {
          obj.reactRoot.unmount();
          obj.audioPlayer?.dispose();
          obj.panner?.dispose();
        });
        if (container) {
          container.removeChild(glRenderer.domElement);
          container.removeChild(cssRenderer.domElement);
        }
      }
      sceneElements.current = undefined;
    };
  }, [isClient, updateWindowTransform]);

  useEffect(() => {
    if (isReady && windows.length === 0) {
      handleAddWindow('welcome');
    }
  }, [isReady, windows.length, handleAddWindow]);


  // Sync React state to Three.js scene
  useEffect(() => {
    if (!sceneElements.current) return;
    const { scene, objects } = sceneElements.current;

    const currentWindowIds = new Set(windows.map(w => w.id));

    // Remove old windows
    objects.forEach((obj, id) => {
      if (!currentWindowIds.has(id)) {
        scene.remove(obj.cssObject);
        obj.reactRoot.unmount();
        obj.audioPlayer?.dispose();
        obj.panner?.dispose();
        objects.delete(id);
      }
    });

    // Add/update windows
    windows.forEach(win => {
      if (!objects.has(win.id)) {
        const contentInfo = windowContents.find(c => c.id === win.contentId);
        if (!contentInfo) return;

        const el = document.createElement('div');
        const reactRoot = createRoot(el);
        const cssObject = new CSS3DObject(el);
        
        cssObject.position.set(win.position.x, win.position.y, win.position.z);
        cssObject.rotation.set(win.rotation.x, win.rotation.y, win.rotation.z);
        cssObject.userData.windowId = win.id;
        
        const onHeaderMouseDown = (e: React.MouseEvent) => {
            const fakeEvent = new PointerEvent('pointerdown', e as any);
            sceneElements.current?.cssRenderer.domElement.dispatchEvent(fakeEvent);
        };

        const ContentComponent = contentInfo.component as React.ElementType;
        const componentProps = win.contentId === 'ai-helper' ? { onRunAI: handleRunAI } : {};

        reactRoot.render(
          <SpatialWindow title={contentInfo.title} onClose={(e) => { e.stopPropagation(); removeWindow(win.id); }} onMouseDown={onHeaderMouseDown} size={contentInfo.defaultSize}>
            <ContentComponent {...componentProps} />
          </SpatialWindow>
        );

        scene.add(cssObject);
        const newObj: any = { cssObject, reactRoot };
        
        if (win.contentId === 'music') {
          const panner = new Tone.Panner3D().toDestination();
          const player = new Tone.Player({
            url: "https://tonejs.github.io/audio/berklee/gong_1.mp3",
            loop: true,
            autostart: true,
            volume: -10,
          }).connect(panner);
          newObj.panner = panner;
          newObj.audioPlayer = player;
        }

        objects.set(win.id, newObj);
      } else {
        // Update existing object if needed (e.g., from AI)
        const obj = objects.get(win.id)?.cssObject;
        if (obj && !obj.position.equals(new THREE.Vector3(win.position.x, win.position.y, win.position.z))) {
            gsap.to(obj.position, { ...win.position, duration: 0.5, ease: 'power2.out' });
        }
      }
    });
  }, [windows, removeWindow, handleRunAI]);
  
  const SceneSetup = () => {
    const sceneRef = sceneElements.current?.scene;
    return sceneRef ? (
      <>
        <Skybox scene={sceneRef} onReady={() => setIsReady(true)} />
        <Lighting scene={sceneRef} />
      </>
    ) : null;
  }
  
  return (
    <>
      <div ref={containerRef} className="absolute inset-0" />
      <SceneSetup />
      {!isReady && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
              <Skeleton className="h-24 w-48 rounded-lg" />
              <p className="text-lg text-white/80">Loading Immersive Environment...</p>
              <Skeleton className="h-4 w-64" />
          </div>
        </div>
      )}
      <TooltipProvider>
        <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full border border-accent/20 bg-background/50 p-2 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => handleAddWindow('welcome')}>
                  <GlassInfoIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Add Info Window</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => handleAddWindow('music')}>
                  <GlassMusicIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Add Music Player</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => handleAddWindow('ai-helper')}>
                  <GlassSparklesIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Open AI Assistant</p></TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
    </>
  );
}
