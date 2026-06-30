import React from "react";

const WorldProps = ({ obstacles }) => {
  return (
    <>
      {obstacles.map((obstacle, index) => (
        <mesh key={`${index}-${obstacle.position.join("-")}`} castShadow receiveShadow position={obstacle.position}>
          <boxGeometry args={obstacle.size} />
          <meshStandardMaterial color={index % 2 === 0 ? "#8e5d3c" : "#9b7d5e"} roughness={0.95} />
        </mesh>
      ))}
      <mesh castShadow receiveShadow position={[0, 0.25, -10]}>
        <boxGeometry args={[18, 0.5, 1.5]} />
        <meshStandardMaterial color="#445d74" roughness={0.9} />
      </mesh>
      <mesh castShadow receiveShadow position={[-8, 0.3, 8]}>
        <boxGeometry args={[3, 0.6, 3]} />
        <meshStandardMaterial color="#5f8c7f" roughness={0.8} />
      </mesh>
    </>
  );
};

export default WorldProps;
