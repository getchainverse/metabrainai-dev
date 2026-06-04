import { Button, Select, Space } from "antd";
import { useState, useEffect } from "react";
import AuthService from "../../../services/auth.service";

const EditRole = ({ role, email }) => {
  const Role_Value = {
    admin: "ROLE_ADMIN",
    level: "ROLE_LEVEL",
    vp: "ROLE_VP",
    sales: "ROLE_SALES",
  };
  const Value_Role = {
    ROLE_ADMIN: "admin",
    ROLE_LEVEL: "level",
    ROLE_VP: "vp",
    ROLE_SALES: "sales",
  };
  const [isRole, setRole] = useState(role);
  const [isEdit, setEdit] = useState(false);
  const [isRoleKey, setRoleKey] = useState(Value_Role[role]);

  const handleChange = (value) => {
    setRole(Role_Value[value]);
    setRoleKey(value);
  };
  const onEdit = () => {
    setEdit(!isEdit);
  };
  const onSet = () => {
    setEdit(!isEdit);
    AuthService.setRoleByUser(isRoleKey, email).then((response) => {
      console.log("response", response);
    });
  };
  return (
    <div className="flex justify-between">
      <div className="my-auto mr-5">
        {!isEdit ? (
          isRole
        ) : (
          <Select
            defaultValue={isRoleKey}
            style={{ width: 120 }}
            onChange={handleChange}
            options={[
              { value: "admin", label: "Manager" },
              { value: "level", label: "Level1" },
              { value: "vp", label: "VP" },
              { value: "sales", label: "Sales" },
            ]}
          />
        )}
      </div>
      <div>
        {isEdit == false ? (
          <Button className="w-16 bg-[#0F7BDE] text-white" onClick={onEdit}>
            Edit
          </Button>
        ) : (
          <Button className="w-16 bg-[#13A710] text-white" onClick={onSet}>
            Set
          </Button>
        )}
      </div>
    </div>
  );
};

export default EditRole;
