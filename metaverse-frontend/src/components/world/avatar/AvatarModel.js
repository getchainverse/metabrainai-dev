import React from "react";

const AvatarModel = ({ customization = {}, scale = 1 }) => {
  const {
    hairStyle = "short",
    hairColor = "#6b4f3b",
    eyesColor = "#2f3a4a",
    bodyColor = "#f2d4b0",
    clothesColor = "#0f7bde",
    accessories = [],
  } = customization;

  return (
    <group scale={scale}>
      {/* Neck */}
      <mesh castShadow position={[0, 1.25, 0]}>
        <cylinderGeometry args={[0.07, 0.08, 0.15, 12]} />
        <meshStandardMaterial color={bodyColor} rough={0.6} />
      </mesh>

      {/* Head */}
      <mesh castShadow position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color={bodyColor} rough={0.6} />
      </mesh>

      {/* Eyes */}
      <mesh castShadow position={[-0.07, 1.5, 0.18]}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshStandardMaterial color={eyesColor} />
      </mesh>
      <mesh castShadow position={[0.07, 1.5, 0.18]}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshStandardMaterial color={eyesColor} />
      </mesh>

      {/* Hair Details */}
      {/* Top Hair Cap */}
      <mesh castShadow position={[0, 1.62, -0.02]}>
        <sphereGeometry args={[0.23, 16, 16]} />
        <meshStandardMaterial color={hairColor} rough={0.8} />
      </mesh>

      {/* Long Hair Strands */}
      {hairStyle === "long" && (
        <>
          <mesh castShadow position={[-0.16, 1.35, -0.1]}>
            <capsuleGeometry args={[0.08, 0.4, 4, 12]} />
            <meshStandardMaterial color={hairColor} rough={0.8} />
          </mesh>
          <mesh castShadow position={[0.16, 1.35, -0.1]}>
            <capsuleGeometry args={[0.08, 0.4, 4, 12]} />
            <meshStandardMaterial color={hairColor} rough={0.8} />
          </mesh>
        </>
      )}

      {/* Curly Hair Strands */}
      {hairStyle === "curly" && (
        <group>
          {[-0.14, 0, 0.14].map((x, idx) => (
            <mesh key={idx} castShadow position={[x, 1.72, 0.05]}>
              <sphereGeometry args={[0.07, 8, 8]} />
              <meshStandardMaterial color={hairColor} rough={0.8} />
            </mesh>
          ))}
        </group>
      )}

      {/* Braids */}
      {hairStyle === "braids" && (
        <>
          <mesh castShadow position={[-0.18, 1.2, -0.05]}>
            <cylinderGeometry args={[0.04, 0.02, 0.5, 8]} />
            <meshStandardMaterial color={hairColor} rough={0.8} />
          </mesh>
          <mesh castShadow position={[0.18, 1.2, -0.05]}>
            <cylinderGeometry args={[0.04, 0.02, 0.5, 8]} />
            <meshStandardMaterial color={hairColor} rough={0.8} />
          </mesh>
        </>
      )}

      {/* Torso / Clothes (Shirt) */}
      <mesh castShadow position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.22, 0.18, 0.65, 16]} />
        <meshStandardMaterial color={clothesColor} rough={0.5} />
      </mesh>

      {/* Left Arm */}
      <mesh castShadow position={[-0.32, 0.9, 0]} rotation={[0, 0, 0.1]}>
        <capsuleGeometry args={[0.06, 0.4, 4, 10]} />
        <meshStandardMaterial color={bodyColor} rough={0.6} />
      </mesh>
      {/* Left Sleeve */}
      <mesh castShadow position={[-0.3, 1.05, 0]} rotation={[0, 0, 0.1]}>
        <cylinderGeometry args={[0.07, 0.07, 0.15, 10]} />
        <meshStandardMaterial color={clothesColor} rough={0.5} />
      </mesh>

      {/* Right Arm */}
      <mesh castShadow position={[0.32, 0.9, 0]} rotation={[0, 0, -0.1]}>
        <capsuleGeometry args={[0.06, 0.4, 4, 10]} />
        <meshStandardMaterial color={bodyColor} rough={0.6} />
      </mesh>
      {/* Right Sleeve */}
      <mesh castShadow position={[0.3, 1.05, 0]} rotation={[0, 0, -0.1]}>
        <cylinderGeometry args={[0.07, 0.07, 0.15, 10]} />
        <meshStandardMaterial color={clothesColor} rough={0.5} />
      </mesh>

      {/* Left Leg */}
      <mesh castShadow position={[-0.11, 0.3, 0]}>
        <capsuleGeometry args={[0.07, 0.45, 4, 10]} />
        <meshStandardMaterial color="#1e293b" rough={0.7} /> {/* Pants */}
      </mesh>

      {/* Right Leg */}
      <mesh castShadow position={[0.11, 0.3, 0]}>
        <capsuleGeometry args={[0.07, 0.45, 4, 10]} />
        <meshStandardMaterial color="#1e293b" rough={0.7} /> {/* Pants */}
      </mesh>

      {/* Left Shoe */}
      <mesh castShadow position={[-0.11, 0.03, 0.06]}>
        <boxGeometry args={[0.09, 0.07, 0.16]} />
        <meshStandardMaterial color="#000000" rough={0.9} />
      </mesh>

      {/* Right Shoe */}
      <mesh castShadow position={[0.11, 0.03, 0.06]}>
        <boxGeometry args={[0.09, 0.07, 0.16]} />
        <meshStandardMaterial color="#000000" rough={0.9} />
      </mesh>

      {/* Accessories: Hat */}
      {accessories.includes("hat") && (
        <mesh castShadow position={[0, 1.76, -0.02]}>
          <cylinderGeometry args={[0.26, 0.28, 0.12, 16]} />
          <meshStandardMaterial color="#0f172a" rough={0.8} />
        </mesh>
      )}

      {/* Accessories: Glasses */}
      {accessories.includes("glasses") && (
        <mesh castShadow position={[0, 1.52, 0.2]}>
          <boxGeometry args={[0.24, 0.05, 0.02]} />
          <meshStandardMaterial color="#000000" rough={0.9} />
        </mesh>
      )}

      {/* Accessories: Headphones */}
      {accessories.includes("headphones") && (
        <group>
          {/* Top Band */}
          <mesh castShadow position={[0, 1.73, 0]}>
            <boxGeometry args={[0.4, 0.03, 0.08]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          {/* Left Ear Pad */}
          <mesh castShadow position={[-0.23, 1.5, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.06, 12]} rotation={[0, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
          {/* Right Ear Pad */}
          <mesh castShadow position={[0.23, 1.5, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.06, 12]} rotation={[0, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
        </group>
      )}

      {/* Accessories: Mask */}
      {accessories.includes("mask") && (
        <mesh castShadow position={[0, 1.42, 0.18]}>
          <boxGeometry args={[0.18, 0.08, 0.05]} />
          <meshStandardMaterial color="#1e293b" rough={0.6} />
        </mesh>
      )}

      {/* Accessories: Earrings */}
      {accessories.includes("earrings") && (
        <group>
          <mesh castShadow position={[-0.23, 1.4, 0]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh castShadow position={[0.23, 1.4, 0]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      )}

      {/* Accessories: Backpack */}
      {accessories.includes("backpack") && (
        <group>
          {/* Backpack Main Bag */}
          <mesh castShadow position={[0, 0.85, -0.24]}>
            <boxGeometry args={[0.26, 0.45, 0.16]} />
            <meshStandardMaterial color="#3b82f6" rough={0.6} />
          </mesh>
          {/* Left Strap */}
          <mesh castShadow position={[-0.14, 0.85, -0.12]}>
            <boxGeometry args={[0.04, 0.42, 0.03]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          {/* Right Strap */}
          <mesh castShadow position={[0.14, 0.85, -0.12]}>
            <boxGeometry args={[0.04, 0.42, 0.03]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        </group>
      )}
    </group>
  );
};

export default AvatarModel;
