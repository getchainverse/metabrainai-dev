import {
  AiOutlineLink,
  AiOutlineFileAdd,
  AiOutlineLoading,
} from "react-icons/ai";
import axios from "axios";
import { Upload, message, Button, Input } from "antd";
import React, { useState, useEffect } from "react";
import CreateKnowLedge from "./CreateKnowLedge";
import InputItem from "../../common/InputItem";
import { Spin } from "antd";
import AddWebsiteUrl from "./AddWebsiteUrl";
import { ShowErrorMessage } from "../../common/Message";

const BoardKnowLedge = ({ step, setStep }) => {
  const [loading, setLoading] = useState(false);
  const [fileUrl, setFileUrl] = useState();
  const [editStatus, setEditStatus] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [webUrl, setWebUrl] = useState("Web URL");
  const [docModal, setDocModal] = useState(false);
  const [webModal, setWebModal] = useState(false);
  const [file, setFile] = useState("");
  const [editDoc, setEditDoc] = useState("");

  const getBase64 = (img, callback) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => callback(reader.result));
    reader.readAsDataURL(img);
  };

  const handleChange = (info) => {
    console.log("info", info);
    setFile(info.file.originFileObj);

    if (info.file.status === "uploading") {
      setLoading(true);
      return;
    }

    if (info.file.status === "done") {
      setDocModal(true);
      setLoading(false);
      console.log("file", info.file);
      setFileUrl(info.file.response.file);
      // Get this url from response in real world.
      // getBase64(info.file.originFileObj, (url) => {
      //   setFileUrl(url);
      // });
      setFile(file);
      setFileList(info.fileList);
    }
    if (info.file.status == "error") {
      setLoading(false);
      ShowErrorMessage(info.file.response)
    }
  };

  const uploadButton = (
    <div className="flex">
      <div className="">
        {!loading ? (
          <AiOutlineFileAdd
            size={60}
            color="white"
            className="shadow-lg rounded-full p-3 bg-gradient-to-r from-green-400 to-blue-500 hover:from-pink-500 hover:to-yellow-500 mx-auto"
          />
        ) : (
          <Spin />
        )}
        {!loading && (
          <p className="text-center mt-3 text-[#0F7BDE] font-bold text-base">
            Drag and Drop or Browse
          </p>
        )}
      </div>
    </div>
  );

  // const beforeUpload = (file) => {
  //   console.log("file", file);
  //   const isPdfOrDoc =
  //     file.type === "text/plain" || file.type === "application/pdf" || file.type ==="application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  //   if (!isPdfOrDoc) {
  //     ShowErrorMessage("You can only upload PDF/Doc file!");
  //   }

  //   return isPdfOrDoc;
  // };

  const onNext = () => {
    setStep("permission");
  };

  const onClickEdit = () => {
    setWebModal(true);
  };

  useEffect(() => {
    setFileList(fileList);
  }, [fileList]);

  return (
    <>
      <div className="w-9/12 px-10 border-l-2">
        <div className="flex flex-wrap justify-around mt-14">
          <div className="my-auto">
            <Upload
              accept="application/pdf, text/plain"
              name="avatar"
              listType="picture-card"
              showUploadList={false}
              action="http://localhost:3001/api/doc/uploaddoc"
              // beforeUpload={beforeUpload}
              onChange={handleChange}
            >
              {uploadButton}
            </Upload>
          </div>
          <div className="border-2 w-80 h-48 my-auto flex rounded-lg shadow-lg border-[#f2f0e9]">
            <div className="m-auto">
              <AiOutlineLink
                className="shadow-lg rounded-full p-3 bg-gradient-to-r from-green-400 to-blue-500 hover:from-pink-500 hover:to-yellow-500 mx-auto"
                size={60}
                color="white"
                onClick={onClickEdit}
              />
              {
                <p
                  className={`text-center mt-3 text-[#0F7BDE] font-bold ${
                    webUrl != "Web URL" && "border-2"
                  } px-10`}
                >
                  {webUrl}
                </p>
              }
            </div>
          </div>
          <div
            className="border-2 w-80 h-48 my-auto flex rounded-lg shadow-lg border-[#f2f0e9]"
            style={{
              backgroundImage: `url('/metaverse.png')`,
              backgroundSize: "cover",
            }}
          ></div>
        </div>
        <div className="flex justify-center mt-20">
          <Button
            className="mt-5 w-32 rounded-xl border-0 bg-[#0F7BDE] font-normal hover:bg-[#183442] [&>span]:text-white"
            onClick={onNext}
          >
            Next
          </Button>
        </div>
        <CreateKnowLedge
          showModal={docModal}
          setShowModal={setDocModal}
          setLoading={setLoading}
          fileUrl={fileUrl}
          file={file}
        />
        <AddWebsiteUrl showModal={webModal} setShowModal={setWebModal} />
      </div>
    </>
  );
};

export default BoardKnowLedge;
