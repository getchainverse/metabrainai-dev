import { useEffect } from "react";
import { AiOutlineRead, AiOutlineAppstore } from "react-icons/ai";

const BoardMenu = ({ step, setStep }) => {
  return (
    <div className="w-3/12 h-80 flex py-20">
      <div className="mx-auto">
        <div className="flex cursor-pointer" onClick={() => setStep("know")}>
          <AiOutlineRead
            className="mr-2"
            size={25}
            color={step != "know" && "#8a8a8a"}
          />
          <p
            className={`${
              step != "know" ? "text-[#8a8a8a] font-bold" : "font-bold"
            }`}
          >
            Knowledge Base
          </p>
        </div>
        <div
          className="flex mt-20 cursor-pointer"
          onClick={() => setStep("permission")}
        >
          <AiOutlineAppstore
            className="mr-2"
            size={25}
            color={step != "permission" && "#8a8a8a"}
          />
          <p
            className={`${
              step != "permission" ? "text-[#8a8a8a] font-bold" : "font-bold"
            }`}
          >
            AI Access Permissions
          </p>
        </div>
      </div>
    </div>
  );
};

export default BoardMenu;
