import React, { useState, useEffect } from "react";
import { Form, Input } from "antd";
import InputItem from "../common/InputItem";
import ButtonItem from "../common/ButtonItem";
import AuthService from "../../services/auth.service";
import { useNavigate } from "react-router-dom";
import { ShowSuccessMessage, ShowErrorMessage } from "../common/Message";

const Register = () => {
  const [successful, setSuccessful] = useState(false);
  const navigate = useNavigate();

  const onFinish = (form) => {
    AuthService.register(
      form.firstname,
      form.lastname,
      form.username,
      form.email,
      form.password,
      form.companyname,
      form.url,
      form.firstaddress,
      form.secondaddress,
      form.country,
      form.zipcode,
      form.phone
    ).then(
      (response) => {
        setSuccessful(true);
        ShowSuccessMessage(response.data.message);
        navigate("/login");
      },
      (error) => {
        console.log("error", error);
        ShowErrorMessage(error.response.data.message);
      }
    );
  };

  return (
    <Form
      className="m-auto mt-16 w-2/3 rounded border border-solid bg-clip-border p-10 shadow-lg"
      layout="vertical"
      initialValues={{
        remember: true,
      }}
      onFinish={onFinish}
    >
      <div className="my-8 text-center text-xl font-normal">
        Sign up your account
      </div>
      <div className="flex justify-evenly">
        <div className="w-1/3">
          <div>
            <p className="text-center mb-6 text-xl font-bold text-red-600">
              Personal Information
            </p>
          </div>
          <InputItem name="firstname" label="First Name" />
          <InputItem name="lastname" label="Last Name" />
          <InputItem name="username" label="Username" />
          <InputItem name="email" label="Official Email ID" type="email" />
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
        </div>
        <div className="w-1/3">
          <div>
            <p className="text-center mb-6 text-xl font-bold text-red-600">
              Company Information
            </p>
          </div>
          <InputItem name="companyname" label="Company Name" />
          <InputItem name="url" label="URL" />
          <InputItem name="firstaddress" label="Address 1" />
          <InputItem name="secondaddress" label="Address 2" />
          <InputItem name="country" label="Country" />
          <InputItem name="zipcode" label="Zip/Postal Code" />
          <InputItem name="phone" label="Phone" />
        </div>
      </div>

      <ButtonItem addClass="w-20 m-auto mt-10" buttonName="Sign Up" />
    </Form>
  );
};

export default Register;
