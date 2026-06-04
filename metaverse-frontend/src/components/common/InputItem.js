import { Form, Input } from "antd";

const InputItem = ({
  name,
  label = "",
  type = "text",
  placeholder = "",
  addClass = "",
  value = "",
  disabled = false,
  prefix = "",
  restField,
  onChange,
}) => {
  return (
    <Form.Item
      {...restField}
      name={name}
      label={label}
      rules={
        type == "password"
          ? [
              {
                required: true,
                message: `Please input ${label}!`,
              },
              {
                min: 6,
                message: `The password must be between 6 and 40 characters.`,
              },
              {
                max: 40,
                message: `The password must be between 6 and 40 characters.`,
              },
            ]
          : [
              {
                required: true,
                message: `Please input ${label}!`,
              },
            ]
      }
    >
      {type == "password" ? (
        <Input.Password
          className={`h-9 ${addClass}`}
          placeholder={placeholder}
          value={value}
        />
      ) : (
        <Input
          className={`${type != "number" && "h-9"} ${addClass}`}
          type={type}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          prefix={prefix}
          onChange={onChange}
        />
      )}
    </Form.Item>
  );
};

export default InputItem;
