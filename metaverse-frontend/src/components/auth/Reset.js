import { useState, useEffect } from "react";
import { Alert, Form, Input } from "antd";
import InputItem from "../common/InputItem";
import ButtonItem from "../common/ButtonItem";
import AuthService from "../../services/auth.service";
import { Buffer } from "buffer";
import { ShowSuccessMessage, ShowErrorMessage } from "../common/Message";

const Reset = ({ id, token }) => {
  const [message, setMessage] = useState("URL does not exist!");
  const [success, setSuccess] = useState(true);

  const userId = Number(Buffer.from(String(id), "base64").toString("ascii"));
  const userToken = String(token);

  const parseJwt = (token) => {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch (e) {
      return null;
    }
  };

  const decodedJwt = parseJwt(userToken);
  const expiredTime = decodedJwt.iat;

  const onFinish = (value) => {
    const data = {
      userId: userId,
      userPassword: value.password,
      expiredTime: expiredTime,
    };
    AuthService.resetPasswordByUser(data).then(
      (response) => {
        ShowSuccessMessage(response.data.message);
      },
      (error) => {
        ShowErrorMessage(error.data.response.message);
      }
    );
  };

  useEffect(() => {
    AuthService.getLastExpiredTime({ id: userId }).then((response) => {
      if (response.data.expiredTime * 1 < expiredTime * 1) {
        setSuccess(true);
      } else {
        setSuccess(false);
        setMessage("URL was expired!");
      }
    });
    console.log("success", success);
    console.log("userID", userId);
  }, []);
  return (
    <Form
      className="m-auto mt-14 w-96 rounded border border-solid bg-clip-border p-10"
      layout="vertical"
      initialValues={{
        remember: true,
      }}
      onFinish={onFinish}
    >
      <div className="my-8 text-center text-xl font-normal">
        Change your password
      </div>

      {success && userId ? (
        <>
          <InputItem name="password" label="Password" type="password" />
          <Form.Item
            name="confirm"
            label="Confirm Password"
            dependencies={["password"]}
            hasFeedback
            rules={[
              {
                required: true,
                message: "Please confirm your password!",
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("The new password that you entered do not match!")
                  );
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          <ButtonItem
            addClass="w-40 m-auto mt-10"
            buttonName="Change Password"
          />
        </>
      ) : (
        <Alert message={message} type="error" />
      )}
    </Form>
  );
};

export default Reset;
