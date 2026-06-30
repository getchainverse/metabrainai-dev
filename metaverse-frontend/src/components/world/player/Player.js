import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import AvatarModel from "../avatar/AvatarModel";

const speed = 4.2;
const jumpVelocity = 5.5;
const playerRadius = 0.35;
const groundY = 0.95;
const gravity = -14;

const Player = ({ obstacles, onStateChange, customization }) => {
  const visual = useRef(null);
  const [jumping, setJumping] = useState(false);
  const position = useRef(new Vector3(0, 2, 0));
  const verticalVelocity = useRef(0);
  const keys = useRef({ w: false, a: false, s: false, d: false, space: false });
  const moveDirection = useRef(new Vector3());
  const animation = useRef("idle");
  const lastReactUpdate = useRef(0);
  const obstacleBoxes = useMemo(
    () =>
      obstacles.map((obstacle) => ({
        minX: obstacle.position[0] - obstacle.size[0] / 2 - playerRadius,
        maxX: obstacle.position[0] + obstacle.size[0] / 2 + playerRadius,
        minZ: obstacle.position[2] - obstacle.size[2] / 2 - playerRadius,
        maxZ: obstacle.position[2] + obstacle.size[2] / 2 + playerRadius,
      })),
    [obstacles]
  );

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.repeat) return;
      if (event.code === "KeyW" || event.code === "ArrowUp") keys.current.w = true;
      if (event.code === "KeyA" || event.code === "ArrowLeft") keys.current.a = true;
      if (event.code === "KeyS" || event.code === "ArrowDown") keys.current.s = true;
      if (event.code === "KeyD" || event.code === "ArrowRight") keys.current.d = true;
      if (event.code === "Space") keys.current.space = true;
    };

    const onKeyUp = (event) => {
      if (event.code === "KeyW" || event.code === "ArrowUp") keys.current.w = false;
      if (event.code === "KeyA" || event.code === "ArrowLeft") keys.current.a = false;
      if (event.code === "KeyS" || event.code === "ArrowDown") keys.current.s = false;
      if (event.code === "KeyD" || event.code === "ArrowRight") keys.current.d = false;
      if (event.code === "Space") keys.current.space = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const isBlocked = (nextX, nextZ) =>
    obstacleBoxes.some(
      (box) => nextX > box.minX && nextX < box.maxX && nextZ > box.minZ && nextZ < box.maxZ
    );

  useFrame((state, delta) => {
    moveDirection.current.set(0, 0, 0);

    if (keys.current.w) moveDirection.current.z -= 1;
    if (keys.current.s) moveDirection.current.z += 1;
    if (keys.current.a) moveDirection.current.x -= 1;
    if (keys.current.d) moveDirection.current.x += 1;

    if (moveDirection.current.lengthSq() > 0) {
      moveDirection.current.normalize();
    }

    const current = position.current;
    const nextX = current.x + moveDirection.current.x * speed * delta;
    const nextZ = current.z + moveDirection.current.z * speed * delta;
    const canMove = !isBlocked(nextX, current.z) && !isBlocked(current.x, nextZ);

    if (canMove) {
      current.x = nextX;
      current.z = nextZ;
    }

    verticalVelocity.current += gravity * delta;

    if (keys.current.space && !jumping && current.y <= groundY + 0.03) {
      verticalVelocity.current = jumpVelocity;
      setJumping(true);
    }

    current.y += verticalVelocity.current * delta;
    if (current.y <= groundY) {
      current.y = groundY;
      verticalVelocity.current = 0;
      setJumping(false);
    }

    if (!state.scene.userData.playerPosition) {
      state.scene.userData.playerPosition = new Vector3();
    }
    state.scene.userData.playerPosition.copy(current);
    animation.current =
      jumping || current.y > groundY + 0.02
        ? "jump"
        : moveDirection.current.lengthSq() > 0
        ? "walk"
        : "idle";

    if (visual.current) {
      visual.current.position.lerp(new Vector3(current.x, current.y - 0.1, current.z), 0.2);
      if (moveDirection.current.lengthSq() > 0) {
        const angle = Math.atan2(moveDirection.current.x, moveDirection.current.z);
        visual.current.rotation.y = angle;
      }
    }

    if (onStateChange) {
      const now = performance.now();
      if (now - lastReactUpdate.current >= 100) {
        lastReactUpdate.current = now;
        onStateChange({
          position: [current.x, current.y, current.z],
          rotation: visual.current ? visual.current.rotation.y : 0,
          animation: animation.current,
          appearance: customization,
        });
      }
    }

    if (current.y < -12) {
      current.set(0, 2, 0);
      verticalVelocity.current = 0;
    }
  });

  return (
    <group ref={visual}>
      <AvatarModel customization={customization} />
    </group>
  );
};

export default Player;
