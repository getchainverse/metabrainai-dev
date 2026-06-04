import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form } from "antd";
import InputItem from "../common/InputItem";
import ButtonItem from "../common/ButtonItem";
import AuthService from "../../services/auth.service";
import { ShowSuccessMessage, ShowErrorMessage } from "../common/Message";

const Login = () => {
  const [isLoading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = (form) => {
    AuthService.login(form.email, form.password).then(
      () => {
        navigate("/home");
        ShowSuccessMessage("Login Successfully");
      },
      (error) => {
        console.log("error", error.message);
        ShowErrorMessage(error.response.data.message);
        setLoading(false);
      }
    );
  };

  return (
    <Form
      layout="vertical"
      onFinish={onFinish}
      className="m-auto mt-36 w-96 rounded border border-solid bg-clip-border p-10 shadow-lg"
    >
      <InputItem name="email" label="Official Email ID" type="email" />
      <InputItem name="password" label="Password" type="password" />
      <div className="flex justify-between mt-10">
        <ButtonItem addClass="w-20" buttonName="Sign in" loading={isLoading} />
        <a className="text-[#0F7BDE]" href="/forgot">
          Forgot Password?
        </a>
      </div>
      <div className="flex mt-8 cursor-pointer">
        <p className="mr-1">Don't have an account?</p>
        <a className="text-[#0F7BDE]" href="/register">
          Sign up
        </a>
      </div>
    </Form>
  );
};

export default Login;
