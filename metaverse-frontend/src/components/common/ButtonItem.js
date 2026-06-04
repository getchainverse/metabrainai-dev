import { Button, Form } from "antd";

const ButtonItem = ({
  buttonName,
  loading = false,
  addClass = "",
  btnAddClass = "",
  icon,
  disabled,
  onClick,
}) => {
  return (
    <Form.Item className={`w-20 ${addClass}`}>
      <Button
        className={`w-full border-0 bg-[#0F7BDE] hover:bg-[#183442] [&>span]:text-white ${btnAddClass}`}
        htmlType="submit"
        disabled={disabled}
        loading={loading}
        onClick={onClick}
        icon={icon}
      >
        {buttonName}
      </Button>
    </Form.Item>
  );
};

export default ButtonItem;
