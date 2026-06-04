import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import InputItem from "../common/InputItem";
import ButtonItem from "../common/ButtonItem";
import AuthService from "../../services/auth.service";
import { Alert, Form } from "antd";
import { ShowErrorMessage, ShowSuccessMessage } from "../common/Message";

const Forgot = () => {
  const [success, setSuccess] = useState(false);

  const onFinish = (value) => {
    AuthService.sendMail(value.email).then(
      (response) => {
        setSuccess(true);
      },
      (error) => {
        ShowErrorMessage(error.response.data.message);
      }
    );
  };

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
        Please verify your email
      </div>

      {!success && (
        <>
          <InputItem name="email" label="Email" type="email" />
          <ButtonItem addClass="w-40 m-auto" buttonName="Send Email" />
        </>
      )}

      {success && (
        <Alert message="Mail was sent successfully!" type="success" />
      )}

      <div className="mt-4 text-center text-base font-normal">
        <a className="text-[#0F7BDE]" href="/login">
          Login
        </a>
      </div>
    </Form>
  );
};

export default Forgot;
