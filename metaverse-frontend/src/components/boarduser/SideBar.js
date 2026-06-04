import { Collapse } from "antd";
import { useEffect, useState } from "react";
import DocService from "../../services/doc.service";
import { ShowErrorMessage, ShowSuccessMessage } from "../common/Message";
const SideBar = ({
  docInfo,
  webInfo,
  setSelectInfo,
  messageArray,
  updatedArray,
  setUpdatedArray,
  partLoad,
  setPartLoad,
  train,
  setTrain,
  setStartMessage,
}) => {
  useEffect(() => {
    setUpdatedArray(updatedArray);
    setPartLoad(partLoad);
  }, [updatedArray.length, partLoad]);

  // const onSelectDoc = (filename) => {
  //   setSelectInfo(filename);
  //   setPartLoad(true);
  //   DocService.embedde(filename, "doc").then((response) => {
  //     if ((response.data = "success")) setPartLoad(false);
  //   });
  // };

  // const onSelectWeb = (filename) => {
  //   setSelectInfo(filename);
  //   setPartLoad(true);
  //   DocService.embedde(filename, "web").then((response) => {
  //     if ((response.data = "success")) setPartLoad(false);
  //   });
  // };

  const onSelectTrain = (docArray, webArray) => {
    setPartLoad(true);
    setTrain(true);
    docInfo = [];
    webInfo = [];
    for (let i = 0; i < docArray.length; i++)
      docInfo.push(docArray[i].filename);
    for (let i = 0; i < webArray.length; i++) webInfo.push(webArray[i].path);
    console.log("docArray", docInfo);
    console.log("webArray", webInfo);
    DocService.embedde(docInfo, webInfo).then((response) => {
      if ((response.data = "success")) {
        setPartLoad(false);
        setTrain(train);
        setStartMessage(true);
        ShowSuccessMessage("Trained Successfully");
      }
    });
  };
  return (
    <div className="w-1/5 bg-[#383838] px-3">
      {/* <div className="flex justify-center border-b-2 border-white py-7">
        <div>
          <p className="text-2xl text-white mt-3">Select the Part</p>
          <div className="mt-10">
            {docInfo.map((item, index) => {
              return (
                <div
                  key={index}
                  className={`${
                    selectInfo != item.filename ? "bg-[#474747]" : "bg-black"
                  } h-10 w-full rounded-lg shadow-lg mt-3 p-2 cursor-pointer`}
                  onClick={() => onSelectDoc(item.filename)}
                >
                  <p className="text-center text-white">{item.basename}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-3">
            {webInfo.map((item, index) => {
              return (
                <div
                  key={index}
                  className={`${
                    selectInfo != item.path ? "bg-[#474747]" : "bg-black"
                  } h-10 w-full rounded-lg shadow-lg mt-3 p-2 cursor-pointer`}
                  onClick={() => onSelectWeb(item.path)}
                >
                  <p className="text-center text-white">{item.basename}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div> */}
      {/* <div className="flex justify-center border-b-2 border-white py-14">
        <div
          className={`${
            train == false ? "bg-[#474747]" : "bg-black"
          } h-10 w-full rounded-lg shadow-lg mt-3 p-2 cursor-pointer`}
          onClick={() => onSelectTrain(docInfo, webInfo)}
        >
          <p className="text-center text-white">train</p>
        </div>
      </div> */}
      <div className="w-full mt-10">
        <p className="text-2xl text-white">Chat History</p>
      </div>
      <div className="flex justify-center mt-10">
        <div className="w-full">
          {messageArray.map((item, index) => {
            return (
              <Collapse
                className="mt-3"
                items={[
                  {
                    key: index,
                    label: <p className="text-white">{item}</p>,
                    children: <p>{updatedArray[index]}</p>,
                  },
                ]}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SideBar;
