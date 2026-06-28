import React, { useState } from "react";
import BoardMenu from "./BoardMenu";
import BoardKnowLedge from "./boardknowledge/BoardKnowLedge";
import BoardAccess from "./boardaccess/BoardAccess";
import AvatarConfigurator from "./AvatarConfigurator";

const BoardAdmin = () => {
  const [step, setStep] = useState("know");

  const renderBoard = () => {
    if (step === "know") {
      return <BoardKnowLedge step={step} setStep={setStep} />;
    } else if (step === "permission") {
      return <BoardAccess />;
    } else if (step === "avatar") {
      return <AvatarConfigurator />;
    } else {
      return <div className="p-10 font-bold text-gray-500">Feature coming soon...</div>;
    }
  };

  return (
    <div className="flex mt-10 max-w-[1400px] mx-auto bg-white rounded-lg shadow-sm border border-gray-200 min-h-[600px] overflow-hidden">
      <BoardMenu step={step} setStep={setStep} />
      <div className="w-9/12 bg-[#f9fafb]">
        {renderBoard()}
      </div>
    </div>
  );
};

export default BoardAdmin;
