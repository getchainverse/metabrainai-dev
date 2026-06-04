import { useState } from "react";
import { Form, Modal, Checkbox, Cascader, Input, Select, Space } from "antd";
import InputItem from "../../common/InputItem";
import TextItem from "../../common/TextItem";
import ButtonItem from "../../common/ButtonItem";
import DocService from "../../../services/doc.service";
import { ShowSuccessMessage, ShowErrorMessage } from "../../common/Message";

const { Option } = Select;
const defaultCheckedList = ["Sales"];

const AddWebsiteUrl = ({ showModal, setShowModal }) => {
  const [form] = Form.useForm();
  const CheckboxGroup = Checkbox.Group;
  const [checkedList, setCheckedList] = useState(defaultCheckedList);
  const [checkAll, setCheckAll] = useState(false);
  const [permission, setPermission] = useState([]);
  const [indeterminate, setIndeterminate] = useState(true);
  const [checkedRoles, setCheckedRoles] = useState(["sales"]);
  const plainOptions = ["Level 1", "Sales", "Manager", "V.P"];
  const roles = { Level1: "level", Sales: "sales", Manager: "admin", VP: "vp" };

  const onChangePermisson = (list) => {
    setCheckedList(list);
    const roleValues = list.map((role) => roles[role]);
    setCheckedRoles(roleValues);
    setIndeterminate(!!list.length && list.length < plainOptions.length);
    setCheckAll(list.length === plainOptions.length);
    // setCheckAll(list.length === plainOptions.length);
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
    DocService.createWebInfo(
      value.weburl,
      value.pagecount,
      value.basename,
      value.description,
      checkedRoles
    ).then(
      (response) => {
        ShowSuccessMessage(response.data.message);
        setShowModal(false);
        setCheckedList(defaultCheckedList);
        form.resetFields();
      },
      (error) => {
        ShowErrorMessage(error.response.data.message);
      }
    );
  };

  const selectAfter = (
    <Select defaultValue=".com">
      <Option value=".com">.com</Option>
      <Option value=".jp">.jp</Option>
      <Option value=".cn">.cn</Option>
      <Option value=".org">.org</Option>
    </Select>
  );

  const selectBefore = (
    <Select defaultValue="http://">
      <Option value="http://">http://</Option>
      <Option value="https://">https://</Option>
    </Select>
  );

  return (
    <Modal open={showModal} onCancel={() => setShowModal(false)} footer={[]}>
      <div>
        <p className="font-bold text-left">Add a website URL</p>
        <Form layout="vertical" onFinish={onFinish} form={form}>
          <div className="px-10 mt-5">
            <InputItem type="url" name="weburl" label="Website URL" />
            <InputItem name="pagecount" label="Number of pages to index" />
            <InputItem name="basename" label="Knowledge Base Name" />
            <TextItem name="description" label="Description (Optional)" />
          </div>
          <div>
            <p className="font-bold flex justify-start">
              Select Permission to access Knowledgebase
            </p>
            <div className="flex justify-center">
              <Checkbox
                className="mr-3 mt-5"
                indeterminate={indeterminate}
                onChange={onCheckAllChange}
                checked={checkAll}
              >
                Everyone
              </Checkbox>
              <CheckboxGroup
                className="flex justify-center mt-5"
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

export default AddWebsiteUrl;
