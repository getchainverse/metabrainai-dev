import React, { useState, useEffect } from "react";
import AuthService from "../../services/auth.service";
import DocService from "../../services/doc.service";
import { Input, Button } from "antd";
import SideBar from "./SideBar";
import HeaderBar from "./HeaderBar";
import ChatBox from "./Chatbox";
import { LoadingOutlined } from "@ant-design/icons";
import { ShowErrorMessage } from "../common/Message";

const BoardUser = () => {
  const [message, setMessage] = useState("");
  const [messageArray, setMessageArray] = useState([]);
  const [docInfo, setDocInfo] = useState([]);
  const [webInfo, setWebInfo] = useState([]);
  const [train, setTrain] = useState(false);
  const [isType, setType] = useState("");
  const [updatedArray, setUpdatedArray] = useState([]);
  const [inputStatus, setInputStatus] = useState(true);
  const [partLoad, setPartLoad] = useState(false);
  const [startMessage, setStartMessage] = useState(false);

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    let info = "";
    let uniqueFileNames = [];
    let uniqueWebNames = [];
    DocService.getDocInfo(user.email).then((response) => {
      console.log("response", response);
      response.data.message.forEach((item) => {
        uniqueFileNames.push(item);
      });
      console.log("content", response.data.message);
      setDocInfo(uniqueFileNames);
    });

    DocService.getWebInfo(user.email).then((response) => {
      console.log("webinfo>>>>>>>>>", response);
      response.data.message.forEach((item) => {
        uniqueWebNames.push(item);
      });
      setWebInfo(uniqueWebNames);
    });
  }, []);

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      onSend();
    }
  };

  const handleChange = (event) => {
    setMessage(event.target.value);
  };

  const onSend = () => {
    if (message != "") {
      messageArray.push(message);
      setMessageArray(messageArray);
      setMessage("");
    } else {
      ShowErrorMessage("Please Input the Message");
    }
  };

  return (
    <div className="w-full bg-[#2c2c2c] min-h-screen flex">
      <SideBar
        docInfo={docInfo}
        webInfo={webInfo}
        train={train}
        setTrain={setTrain}
        messageArray={messageArray}
        updatedArray={updatedArray}
        partLoad={partLoad}
        setPartLoad={setPartLoad}
        setUpdatedArray={setUpdatedArray}
        setStartMessage={setStartMessage}
      />
      <div className="w-4/5">
        <HeaderBar />
        {!partLoad ? (
          <div className="px-1 mt-10">
            <div className="flex-1 bg-gray-200 px-6 py-4">
              <div className="flex flex-col h-full">
                <div className="overflow-y-auto flex-1">
                  {messageArray.map((item, index) => {
                    return (
                      <ChatBox
                        question={item}
                        key={index}
                        isType={isType}
                        inputStatus={inputStatus}
                        setInputStatus={setInputStatus}
                        updatedArray={updatedArray}
                        setUpdatedArray={setUpdatedArray}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-center items-center py-2">
                  <Input
                    className="rounded-lg px-4 py-2 w-full"
                    value={message}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    disabled={!inputStatus}
                  />
                  <Button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold rounded-lg ml-2"
                    onClick={onSend}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-20">
            <LoadingOutlined
              style={{
                fontSize: 36,
                color: "white",
              }}
              spin
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BoardUser;
