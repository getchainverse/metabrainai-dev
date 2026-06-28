import React, { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

// A proxy component representing the dynamically colored/scaled avatar
const AvatarProxy = ({ config }) => {
  const groupRef = useRef();

  // Animate a simple idle breathing motion
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.position.y = Math.sin(t * 2) * 0.05;
  });

  // Map configurations to dynamic styles
  const skinColor = config.bodySettings?.skinTone || "#fcd1b5";
  const primaryColor = config.colors?.primary || "#ffffff";
  const heightScale = config.bodySettings?.height || 1.0;
  const buildScale = config.bodySettings?.weight || 1.0;

  return (
    <group ref={groupRef} scale={[buildScale, heightScale, buildScale]} position={[0, heightScale * 1.5, 0]}>
      
      {/* Head */}
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color={skinColor} roughness={0.4} />
      </mesh>
      
      {/* Hair Proxy */}
      <mesh position={[0, 1.45, 0]}>
        <boxGeometry args={[0.4, 0.2, 0.4]} />
        <meshStandardMaterial color={config.hairSettings?.hairColor || "#333"} roughness={0.7} />
      </mesh>

      {/* Body / Torso */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.35, 1.5, 32]} />
        <meshStandardMaterial color={primaryColor} roughness={0.8} />
      </mesh>

      {/* Arms */}
      <mesh position={[-0.6, 0.2, 0]}>
        <cylinderGeometry args={[0.12, 0.1, 1.2, 16]} />
        <meshStandardMaterial color={primaryColor} roughness={0.8} />
      </mesh>
      <mesh position={[0.6, 0.2, 0]}>
        <cylinderGeometry args={[0.12, 0.1, 1.2, 16]} />
        <meshStandardMaterial color={primaryColor} roughness={0.8} />
      </mesh>

      {/* Legs */}
      <mesh position={[-0.2, -1.2, 0]}>
        <cylinderGeometry args={[0.15, 0.12, 1.2, 16]} />
        <meshStandardMaterial color={config.colors?.secondary || "#222"} roughness={0.6} />
      </mesh>
      <mesh position={[0.2, -1.2, 0]}>
        <cylinderGeometry args={[0.15, 0.12, 1.2, 16]} />
        <meshStandardMaterial color={config.colors?.secondary || "#222"} roughness={0.6} />
      </mesh>
    </group>
  );
};

const AvatarPreviewScene = ({ config }) => {
  return (
    <div className="h-full w-full bg-gradient-to-b from-slate-900 to-slate-800">
      <Canvas shadows camera={{ position: [0, 2, 5], fov: 45 }}>
        <color attach="background" args={["#1e293b"]} />
        <fog attach="fog" args={["#1e293b", 5, 15]} />

        {/* Lighting setup for AAA feel */}
        <ambientLight intensity={0.4} />
        <directionalLight
          castShadow
          position={[2.5, 8, 5]}
          intensity={1.5}
          shadow-mapSize={1024}
        >
          <orthographicCamera attach="shadow-camera" args={[-10, 10, -10, 10, 0.1, 50]} />
        </directionalLight>
        <pointLight position={[-10, 0, -20]} color="cyan" intensity={1} />
        <pointLight position={[10, 0, -20]} color="fuchsia" intensity={1} />

        <Suspense fallback={null}>
          {/* Group containing the character */}
          <group position={[0, -1.5, 0]}>
            <AvatarProxy config={config} />
            <ContactShadows
              resolution={1024}
              scale={10}
              blur={2}
              opacity={0.5}
              far={10}
              color="#000000"
            />
          </group>
          <Environment preset="city" />
        </Suspense>

        <OrbitControls
          makeDefault
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2 + 0.1}
          enableZoom={true}
          minDistance={2}
          maxDistance={8}
          enablePan={false}
        />
      </Canvas>
    </div>
  );
};

export default AvatarPreviewScene;
