import { useEffect } from "react";
import { AiOutlineRead, AiOutlineAppstore, AiOutlinePlayCircle, AiOutlineCreditCard, AiOutlineSetting, AiOutlineIdcard } from "react-icons/ai";

const BoardMenu = ({ step, setStep }) => {
  const menuItems = [
    { id: "start", label: "Get Started", icon: AiOutlinePlayCircle },
    { id: "permission", label: "AI Access Permissions", icon: AiOutlineAppstore },
    { id: "know", label: "Knowledge Base", icon: AiOutlineRead },
    { id: "avatar", label: "Avatar Configuration", icon: AiOutlineIdcard },
    { id: "billing", label: "Billing", icon: AiOutlineCreditCard },
    { id: "settings", label: "Settings", icon: AiOutlineSetting },
  ];

  return (
    <div className="w-3/12 flex flex-col py-10 px-6 border-r border-gray-100 min-h-[500px]">
      <div className="flex flex-col gap-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = step === item.id;
          return (
            <div
              key={item.id}
              className="flex items-center cursor-pointer transition-colors hover:text-[#0F7BDE]"
              onClick={() => setStep(item.id)}
            >
              <Icon
                className="mr-3"
                size={22}
                color={isActive ? "#0F7BDE" : "#8a8a8a"}
              />
              <p
                className={`font-semibold text-[15px] ${
                  isActive ? "text-[#0F7BDE]" : "text-[#8a8a8a]"
                }`}
              >
                {item.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BoardMenu;
