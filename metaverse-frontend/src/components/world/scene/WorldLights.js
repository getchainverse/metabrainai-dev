import React from "react";

const WorldLights = () => {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight
        castShadow
        position={[8, 12, 6]}
        intensity={1.45}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-8, 5, -4]} intensity={0.35} color="#a6d8ff" />
      <hemisphereLight intensity={0.35} skyColor="#c7f0ff" groundColor="#8ed18b" />
    </>
  );
};

export default WorldLights;
