import React, { useState, useEffect } from "react";
import { Menu } from "antd";
import NavItem from "./common/NavItem";
import AuthService from "../services/auth.service";
import ButtonItem from "./common/ButtonItem";
import arrowdown from "../assets/arrow-down.svg";
import Spinner from "../assets/spinner.gif";
import AuthLogo from "../components/AuthLogo";
import Loading from "../assets/loading.svg";
import { database, ref, push, set, get } from "../components/firebase";
import '../ph.css'
const Header = () => {
  const maxTrial = 2;
  const [over, setOver] = React.useState(false);
  const [currentUser, setCurrentUser] = useState();
  const [showAdminBoard, setShowAdminBoard] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [rightPos, setRightPos] = React.useState(0);
  const [value, setValue] = React.useState("");
  const [count, setCount] = React.useState(1);
  const formLabelRef = React.useRef(HTMLLabelElement);
  const unlockButtonRef = React.useRef(HTMLButtonElement);
  const modalRef = React.useRef();
  const [wrongPass, setWrongPass] = React.useState(false);
  const [showDelay, setShowDelay] = React.useState(false);
  const [pixelValue, setPixelValue] = React.useState(36);
  const [enterCount, setEnterCount] = React.useState(0);
  const [spinner, setSpinner] = React.useState(false);
  const handleClickOutside = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      setIsVisible(false);
      setValue("");
    }
  };

  const logOut = () => {
    AuthService.logout();
    setCurrentUser(undefined);
  };

  const openModal = () => {
    setIsVisible(true);
  };


  useEffect(() => {
    const user = AuthService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setShowAdminBoard(user.roles.includes("ROLE_ADMIN"));
    }
    console.log("user", user);
  }, []);


  return (
    <>
      <Menu className="h-[70px] px-16 border-2 drop-shadow-lg">
        {currentUser ? (
          <>
            <div className="float-left mt-3">
              <img
                src="./MetasphereswithTagLine.png"
                style={{ width: 60, height: 45 }}
              />
            </div>
            <div className="float-right flex">
              <NavItem to="/home" title="Home" />
              {/* <NavItem to="/mod" title="Moderator Board" /> */}
              {showAdminBoard && <NavItem to="/admin" title="Knowledge Base" />}
              <NavItem to="/user" title="User" />
              <li className="my-5 ml-24 block text-lg font-normal hover:font-bold hover:text-back-red md:inline-block">
                <a href="/login" onClick={logOut}>
                  LogOut
                </a>
              </li>
              <NavItem to="/profile" title={currentUser.username} />
            </div>
          </>
        ) : (
          <>
            <div className="float-left mt-3">
              <img
                src="./MetasphereswithTagLine.png"
                style={{ width: 60, height: 45 }}
              />
            </div>
            <div className="float-right flex">
              <NavItem
                to="/login"
                title="Login"
                addClass="border-2 text-center"
              />
              <ButtonItem
                buttonName="Connect"
                addClass="bg-white text-center ml-8 w-24 m-auto"
                onClick={openModal}
              />
            </div>
          </>
        )}
      </Menu>
      <>
      </>
    </>
  );
};

export default Header;
