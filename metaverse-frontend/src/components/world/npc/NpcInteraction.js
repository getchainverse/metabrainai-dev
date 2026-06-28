import React, { useState } from "react";
import { Html } from "@react-three/drei";
import { Vector3 } from "three";
import { useFrame, useThree } from "@react-three/fiber";
import AvatarModel from "../avatar/AvatarModel";

const npcPosition = new Vector3(5.5, 0.95, 2.5);

const NpcInteraction = ({ onInteract, chatOpen }) => {
  const [showButton, setShowButton] = useState(false);
  const { scene } = useThree();

  useFrame(() => {
    const playerPosition = scene.userData.playerPosition;
    if (!playerPosition) return;
    const distance = npcPosition.distanceTo(new Vector3(...playerPosition));
    setShowButton(distance < 3);
  });

  return (
    <group position={npcPosition.toArray()}>
      <AvatarModel
        customization={{
          hairStyle: "curly",
          hairColor: "#1f2937",
          eyesColor: "#1d4ed8",
          bodyColor: "#f5d0a9",
          clothesColor: "#7c3aed",
          accessories: ["glasses"],
        }}
        scale={1.05}
      />
      {showButton && !chatOpen && (
        <Html center distanceFactor={10}>
          <button
            type="button"
            onClick={onInteract}
            className="rounded-full border border-white/30 bg-slate-950/80 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-md"
          >
            Talk
          </button>
        </Html>
      )}
    </group>
  );
};

export default NpcInteraction;
