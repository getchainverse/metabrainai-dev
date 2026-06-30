import React from "react";

const Ground = () => {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[120, 120]} />
      <meshStandardMaterial color="#7ecf7a" roughness={1} metalness={0} />
    </mesh>
  );
};

export default Ground;
