import { Input, Tag } from "antd";
import { useEffect, useState } from "react";
import DocService from "../../services/doc.service";
import { LoadingOutlined } from "@ant-design/icons";
import { Spin } from "antd";
import { ShowErrorMessage } from "../common/Message";
const ChatBox = ({
  question,
  key,
  isType,
  startMessage,
  setInputStatus,
  setUpdatedArray,
}) => {
  const [answer, setAnswer] = useState("");
  const [dateTime, setDateTime] = useState("");

  useEffect(() => {
    setInputStatus(false);
    DocService.chat(question).then(
      (response) => {
        console.log("response", response);
        setAnswer(response.data);
        setInputStatus(true);
        setInputStatus(true);
        console.log(response.data);
        // updatedArray.push(response.data);
        // setUpdatedArray(updatedArray);
        setUpdatedArray((arr) => [...arr, response.data]);

        let currentdate = new Date();
        let time =
          "Last Sync: " +
          +currentdate.getHours() +
          ":" +
          currentdate.getMinutes() +
          ":" +
          currentdate.getSeconds();
        setDateTime(time);
      },
      (error) => {
        console.log("error", error);
        ShowErrorMessage(error.response.data.message);
        setAnswer(error.response.data.error);
        setUpdatedArray((arr) => [...arr, error.response.data.error]);
        setInputStatus(true);
      }
    );
  }, [key]);

  return (
    <>
      <div class="flex justify-start items-end mb-4">
        <div class="bg-white rounded-lg p-3 max-w-xs mx-2 shadow">
          <p class="text-sm mb-2">{question}👋</p>
          <p class="text-gray-600 text-xs">{dateTime}</p>
        </div>
        {/* <img src="https://randomuser.me/api/portraits/men/1.jpg" alt="avatar" class="w-6 h-6 rounded-full"> */}
      </div>

      <div class="flex justify-end items-end mb-4">
        {answer ? (
          <div class="bg-white rounded-lg p-3 max-w-xs mx-2 shadow">
            <p class="text-sm mb-2">{answer}</p>
            <p class="text-gray-600 text-xs">{dateTime}</p>
          </div>
        ) : (
          <div className="px-2">
            <LoadingOutlined
              style={{
                fontSize: 24,
              }}
              spin
            />
          </div>
        )}
        {/* <img src="https://randomuser.me/api/portraits/men/1.jpg" alt="avatar" class="w-6 h-6 rounded-full"> */}
      </div>
    </>
  );
};

export default ChatBox;
