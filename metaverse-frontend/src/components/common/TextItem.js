import { Form, Input } from "antd";

const TextItem = ({
  name,
  label = "",
  placeholder = "",
  addClass = "",
  value = "",
}) => {
  const { TextArea } = Input;

  return (
    <Form.Item
      name={name}
      label={label}
      rules={[
        {
          required: true,
          message: `Please input ${label}!`,
        },
      ]}
    >
      <TextArea
        className={`${addClass}`}
        placeholder={placeholder}
        value={value}
      />
    </Form.Item>
  );
};

export default TextItem;
