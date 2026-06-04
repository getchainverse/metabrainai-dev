import React, { useState, useEffect } from "react";
import BoardMenu from "./BoardMenu";
import BoardKnowLedge from "./boardknowledge/BoardKnowLedge";
import BoardAccess from "./boardaccess/BoardAccess";
const BoardAdmin = () => {
  const [step, setStep] = useState("know");

  const renderBoard = () => {
    if (step == "know") {
      return <BoardKnowLedge step={step} setStep={setStep} />;
    } else {
      return <BoardAccess />;
    }
  };

  return (
    <div className="flex mt-40">
      <BoardMenu step={step} setStep={setStep} />
      {renderBoard()}
    </div>
  );
};

export default BoardAdmin;
