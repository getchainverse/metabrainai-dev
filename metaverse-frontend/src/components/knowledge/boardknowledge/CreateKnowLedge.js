import { Alert, Button, Form, Checkbox, Modal } from "antd";
import InputItem from "../../common/InputItem";
import TextItem from "../../common/TextItem";
import ButtonItem from "../../common/ButtonItem";
import DocService from "../../../services/doc.service";
import { ShowSuccessMessage, ShowErrorMessage } from "../../common/Message";
import { useState } from "react";

const defaultCheckedList = ["Sales"];

const CreateKnowLedge = ({
  showModal,
  setShowModal,
  setLoading,
  fileUrl,
  file,
}) => {
  console.log("fileUrl", fileUrl);
  const [form] = Form.useForm();
  const [checkedList, setCheckedList] = useState(defaultCheckedList);
  const [indeterminate, setIndeterminate] = useState(true);
  const [checkAll, setCheckAll] = useState(false);
  const [checkedRoles, setCheckedRoles] = useState(["sales"]);
  const CheckboxGroup = Checkbox.Group;
  const plainOptions = ["Level1", "Sales", "Manager", "VP"];
  const roles = { Level1: "level", Sales: "sales", Manager: "admin", VP: "vp" };

  const onChangePermisson = (list) => {
    setCheckedList(list);
    const roleValues = list.map((role) => roles[role]);
    setCheckedRoles(roleValues);
    setIndeterminate(!!list.length && list.length < plainOptions.length);
    setCheckAll(list.length === plainOptions.length);
  };

  const onCheckAllChange = (e) => {
    setCheckedList(e.target.checked ? plainOptions : []);
    const roleValues = e.target.checked
      ? plainOptions.map((role) => roles[role])
      : ["sales"];
    setCheckedRoles(roleValues);
    setIndeterminate(false);
    setCheckAll(e.target.checked);
  };

  const onFinish = (value) => {
    DocService.createDocInfo(
      value.basename,
      value.description,
      checkedRoles,
      fileUrl,
      file.name
    ).then(
      (response) => {
        console.log("knowledge", response.data.message);
        ShowSuccessMessage(response.data.message);
        setShowModal(false);
        setLoading(false);
        setCheckedList(defaultCheckedList);
        form.resetFields();
      },
      (error) => {
        ShowErrorMessage(error.response.data.message);
      }
    );
  };

  return (
    <Modal open={showModal} footer={[]} onCancel={() => setShowModal(false)}>
      <div>
        <p className="font-bold text-left">Create Knowledge Base</p>
        <div className="px-10 mt-5">
          <p className="text-left">Uploaded Documents</p>
          <Alert message={file.name} type="success" className="mt-3" />
          {/* <Button className="w-24 rounded-xl bg-white flex justify-start mt-10 text-center">
            Add more
          </Button> */}
        </div>
        <Form
          layout="vertical"
          className="mt-5"
          initialValues={{
            remember: false,
          }}
          onFinish={onFinish}
          form={form}
        >
          <div className="px-10">
            <InputItem name="basename" label="Knowledge Base Name" />
            <TextItem name="description" label="Description (Optional)" />
          </div>

          <div>
            <p className="font-bold flex justify-start">
              Select Permission to access Knowledgebase
            </p>
            <div className="mt-5 flex justify-center">
              <Checkbox
                className="mr-3"
                indeterminate={indeterminate}
                onChange={onCheckAllChange}
                checked={checkAll}
              >
                Everyone
              </Checkbox>
              <CheckboxGroup
                className="my-auto mt-[1px]"
                options={plainOptions}
                value={checkedList}
                onChange={onChangePermisson}
              />
            </div>
          </div>
          <div className="flex justify-center">
            <ButtonItem buttonName="Save and process" addClass="w-40 mt-12" />
          </div>
        </Form>
      </div>
    </Modal>
  );
};

export default CreateKnowLedge;
