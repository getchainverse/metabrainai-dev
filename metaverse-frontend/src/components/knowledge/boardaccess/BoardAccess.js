import { Button, Modal, Table, List } from "antd";
import { useState, useEffect } from "react";
import EditRole from "./EditRole";
import AuthService from "../../../services/auth.service";
import ErrorList from "antd/es/form/ErrorList";
const BoardAccess = () => {
  const [userData, setUserData] = useState([]);
  const [isEdit, setEdit] = useState([false]);
  const columns = [
    {
      title: "Name",
      dataIndex: "fullName",
    },
    {
      title: "Email",
      dataIndex: "email",
    },
    {
      title: "Role",
      dataIndex: "role",
    },
    {
      title: "Doc Information",
      dataIndex: "aidoc",
    },
    {
      title: "Web Information",
      dataIndex: "webdoc",
    },
  ];

  // const EditRole = (role, index) => {
  //   const setRole = () => {
  //     console.log("index", index);
  //     console.log("isEdit", isEdit);
  //     isEdit[index] = !isEdit[index];
  //     setEdit(isEdit);
  //   };

  //   useEffect(() => {
  //     setEdit(isEdit);
  //   }, [isEdit]);

  //   return (
  //     <div className="flex justify-between">
  //       <div className="my-auto">{role} </div>
  //       <div>
  //         <Button className="w-20" onClick={() => setRole(index)}>
  //           {!isEdit[index] ? "Edit" : "Set"}
  //         </Button>
  //       </div>
  //     </div>
  //   );
  // };

  const getAllUser = () => {
    AuthService.getAllUserData().then(
      (response) => {
        const userInfoData = [];
        response.data.forEach((element, index) => {
          let docinfos = [];
          let webinfos = [];
          for (let i = 0; i < element.docInfos.length; i++)
            docinfos.push(element.docInfos[i].basename);
          for (let i = 0; i < element.webInfos.length; i++)
            webinfos.push(element.webInfos[i].basename);
          console.log("webinfos", webinfos);
          const AiDocComponent =
            docinfos.length != 0 ? (
              <List
                size="small"
                bordered
                dataSource={docinfos}
                renderItem={(item) => <List.Item>{item}</List.Item>}
              />
            ) : (
              <></>
            );
          const WebDocComponent =
            webinfos.length != 0 ? (
              <List
                size="small"
                bordered
                dataSource={webinfos}
                renderItem={(item) => <List.Item>{item}</List.Item>}
              />
            ) : (
              <></>
            );
          userInfoData.push({
            fullName: element.username,
            email: element.email,
            role: (
              <EditRole
                key={index}
                role={element.roles}
                email={element.email}
              />
            ),
            aidoc: AiDocComponent,
            webdoc: WebDocComponent,
          });
        });
        setUserData(userInfoData);
      },
      (error) => {
        console.log("error", error);
      }
    );
  };

  useEffect(() => {
    getAllUser();
  }, []);

  const onSave = () => {
    getAllUser();
  };

  return (
    <div className="w-9/12 px-10 border-l-2 flex justify-center">
      <div className="my-auto">
        <Button
          className="w-20 float-right bg-[#0F7BDE] text-white"
          onClick={onSave}
        >
          Save
        </Button>
        <Table
          className="mt-14"
          bordered
          columns={columns}
          style={{
            width: "100%",
            wordWrap: "break-word",
            tableLayout: "fixed",
          }}
          dataSource={userData}
        />
      </div>
    </div>
  );
};

export default BoardAccess;
