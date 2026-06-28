import React, { memo, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MathUtils, Vector3 } from "three";
import AvatarModel from "../avatar/AvatarModel";

const tintForId = (id) => {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  return `hsl(${hue} 72% 62%)`;
};

const RemotePlayer = ({ player }) => {
  const root = useRef(null);
  const target = useRef(new Vector3(...(player.position || [0, 0.95, 0])));
  const rotation = useRef(player.rotation || 0);
  const color = useMemo(() => tintForId(player.id), [player.id]);

  useFrame((_, delta) => {
    if (!root.current) return;
    const next = new Vector3(...(player.position || [0, 0.95, 0]));
    target.current.lerp(next, 0.18);
    rotation.current = MathUtils.lerp(rotation.current, player.rotation || 0, 0.18);

    root.current.position.lerp(target.current, 0.18);
    root.current.rotation.y = rotation.current;
    if (player.animation === "jump") {
      root.current.position.y += Math.sin(Date.now() / 90) * 0.03;
    }
  });

  return (
    <group ref={root}>
      <AvatarModel customization={player.appearance || { bodyColor: color }} />
    </group>
  );
};

export default memo(RemotePlayer);
