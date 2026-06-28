import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Grid } from "@react-three/drei";
import AvatarModel from "../world/avatar/AvatarModel";
import { Select } from "antd";
import { ShowSuccessMessage, ShowErrorMessage } from "../common/Message";
import AdminService from "../../services/admin.service";

const { Option } = Select;

const colors = [
  "#6b4f3b", "#0f172a", "#ef4444", "#3b82f6", "#10b981", "#fbbf24", "#f2d4b0", "#8b5a2b", "#ffcc99", "#d2b48c"
];

const ActionButton = ({ onClick, children }) => (
  <button 
    onClick={onClick}
    className="bg-white text-black font-semibold text-sm px-4 py-1.5 shadow-sm border border-gray-200 hover:bg-gray-50"
  >
    {children}
  </button>
);

const AvatarConfigurator = () => {
  const [customization, setCustomization] = useState({
    hairStyle: "short",
    hairColor: "#6b4f3b",
    eyesColor: "#2f3a4a",
    bodyColor: "#f2d4b0",
    clothesColor: "#0f7bde",
    accessories: [],
  });

  const [saving, setSaving] = useState(false);

  const randomize = () => {
    const randomColor = () => colors[Math.floor(Math.random() * colors.length)];
    const hairStyles = ["short", "long", "curly", "braids"];
    const allAccessories = ["hat", "glasses", "headphones", "mask", "earrings", "backpack"];
    
    // Pick 0 to 2 random accessories
    const numAccessories = Math.floor(Math.random() * 3);
    const shuffledAccessories = [...allAccessories].sort(() => 0.5 - Math.random());
    const selectedAccessories = shuffledAccessories.slice(0, numAccessories);

    setCustomization({
      hairStyle: hairStyles[Math.floor(Math.random() * hairStyles.length)],
      hairColor: randomColor(),
      eyesColor: randomColor(),
      bodyColor: randomColor(),
      clothesColor: randomColor(),
      accessories: selectedAccessories,
    });
  };

  const changeWardrobe = () => {
    setCustomization((prev) => {
      const allAccessories = ["hat", "glasses", "headphones", "mask", "earrings", "backpack"];
      const numAccessories = Math.floor(Math.random() * 3);
      const shuffledAccessories = [...allAccessories].sort(() => 0.5 - Math.random());
      return {
        ...prev,
        accessories: shuffledAccessories.slice(0, numAccessories),
      };
    });
  };

  const changeColors = () => {
    const randomColor = () => colors[Math.floor(Math.random() * colors.length)];
    setCustomization((prev) => ({
      ...prev,
      clothesColor: randomColor(),
      hairColor: randomColor(),
    }));
  };

  const changeDNA = () => {
    const randomColor = () => colors[Math.floor(Math.random() * colors.length)];
    const hairStyles = ["short", "long", "curly", "braids"];
    setCustomization((prev) => ({
      ...prev,
      bodyColor: randomColor(),
      eyesColor: randomColor(),
      hairStyle: hairStyles[Math.floor(Math.random() * hairStyles.length)],
    }));
  };

  const handleStart = async () => {
    setSaving(true);
    try {
      // Create avatar in the backend
      await AdminService.createAvatar({
        name: "New AI Avatar",
        description: "Metaverse Chatbot Avatar",
        voice: "en-US-Standard-A",
        model: "gpt-3.5-turbo",
        isActive: true,
        temperature: 0.7,
        prompt: "You are a helpful AI assistant in the Metaverse.",
      });
      ShowSuccessMessage("Avatar configuration saved successfully!");
    } catch (error) {
      ShowErrorMessage("Failed to save avatar configuration");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full relative h-full min-h-[600px] flex flex-col bg-[#8c929c]">
      {/* Top Bar Controls */}
      <div className="absolute top-4 left-0 w-full flex justify-between items-center px-4 z-10">
        <div className="flex gap-2">
          <ActionButton onClick={changeWardrobe}>Change Wardrobe</ActionButton>
          <ActionButton onClick={changeColors}>Change Colors</ActionButton>
          <ActionButton onClick={changeDNA}>Change DNA</ActionButton>
          <ActionButton onClick={randomize}>Randomize</ActionButton>
        </div>
        
        <div className="flex gap-2 bg-white px-2 py-1 shadow-sm border border-gray-200">
          <Select 
            defaultValue="HumanFemale" 
            style={{ width: 140 }} 
            bordered={false}
            className="text-sm font-semibold"
          >
            <Option value="HumanFemale">HumanFemale</Option>
            <Option value="HumanMale">HumanMale</Option>
            <Option value="Robot">Robot</Option>
          </Select>
          <Select 
            defaultValue="Center" 
            style={{ width: 100 }} 
            bordered={false}
            className="text-sm font-semibold border-l border-gray-200"
          >
            <Option value="Center">Center</Option>
            <Option value="Left">Left</Option>
            <Option value="Right">Right</Option>
          </Select>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 w-full h-full relative">
        <Canvas shadows camera={{ position: [0, 2, 6], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[5, 5, 5]}
            intensity={1.2}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <Environment preset="sunset" background blur={0} />
          
          <group position={[0, -1, 0]}>
            <AvatarModel customization={customization} scale={1.5} />
            <ContactShadows position={[0, 0, 0]} opacity={0.6} scale={15} blur={1.5} far={4} />
            <Grid 
              renderOrder={-1} 
              position={[0, 0, 0]} 
              infiniteGrid 
              fadeDistance={50} 
              fadeStrength={5} 
              cellSize={0.6} 
              cellThickness={1} 
              cellColor="#444444" 
              sectionSize={3} 
              sectionThickness={1.5} 
              sectionColor="#222222" 
            />
            {/* Base ground plane to hide under the grid if needed */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
              <planeGeometry args={[100, 100]} />
              <meshStandardMaterial color="#6b6967" />
            </mesh>
          </group>

          <OrbitControls 
            enablePan={false} 
            minPolarAngle={Math.PI / 4} 
            maxPolarAngle={Math.PI / 1.8} 
            minDistance={3} 
            maxDistance={10}
            target={[0, 1, 0]}
          />
        </Canvas>
      </div>

      {/* Bottom Start Button */}
      <div className="absolute bottom-4 right-4 z-10">
        <button 
          onClick={handleStart} 
          disabled={saving}
          className="bg-white text-black font-semibold text-lg px-12 py-2 shadow-md hover:bg-gray-50 border border-gray-200"
        >
          {saving ? "SAVING..." : "START"}
        </button>
      </div>
    </div>
  );
};

export default AvatarConfigurator;
