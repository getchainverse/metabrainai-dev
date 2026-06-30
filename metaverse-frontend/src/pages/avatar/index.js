import React from "react";
import Header from "../../components/Header";
import AvatarStudio from "../../components/world/avatar/AvatarStudio";

const AvatarPage = () => {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <div className="flex-1 relative">
        <AvatarStudio />
      </div>
    </div>
  );
};

export default AvatarPage;
