import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";

const FollowCamera = () => {
  const { camera, scene, gl } = useThree();
  const target = useRef(new Vector3());

  const theta = useRef(0); // Horizontal angle
  const phi = useRef(0.25); // Vertical angle
  const isDragging = useRef(false);
  const prevMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseDown = (e) => {
      isDragging.current = true;
      prevMouse.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e) => {
      if (!isDragging.current) return;
      const deltaX = e.clientX - prevMouse.current.x;
      const deltaY = e.clientY - prevMouse.current.y;
      prevMouse.current = { x: e.clientX, y: e.clientY };

      theta.current -= deltaX * 0.005;
      phi.current = Math.max(0.05, Math.min(Math.PI / 2.2, phi.current + deltaY * 0.005));
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    const dom = gl.domElement;
    dom.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    // Mobile touch controls
    const handleTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      isDragging.current = true;
      prevMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const handleTouchMove = (e) => {
      if (!isDragging.current || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - prevMouse.current.x;
      const deltaY = e.touches[0].clientY - prevMouse.current.y;
      prevMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

      theta.current -= deltaX * 0.008;
      phi.current = Math.max(0.05, Math.min(Math.PI / 2.2, phi.current + deltaY * 0.008));
    };

    const handleTouchEnd = () => {
      isDragging.current = false;
    };

    dom.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      dom.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      dom.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [gl]);

  useFrame(() => {
    const playerPosition = scene.userData.playerPosition;
    if (!playerPosition) return;

    target.current.copy(playerPosition);

    const radius = 7.5;
    const x = radius * Math.sin(theta.current) * Math.cos(phi.current);
    const z = radius * Math.cos(theta.current) * Math.cos(phi.current);
    const y = radius * Math.sin(phi.current) + 1.2;

    const dynamicOffset = new Vector3(x, y, z);
    camera.position.lerp(target.current.clone().add(dynamicOffset), 0.15);
    camera.lookAt(target.current.clone().add(new Vector3(0, 1.2, 0)));
  });

  return null;
};

export default FollowCamera;
