//React
import { useEffect, useState } from "react";
import { Auth, User, updateProfile } from "firebase/auth";

//packages
import Modal from "react-modal";
import Toast from "../resources/api/toast";
import getWindows, { getWindowsName, versionToBuild } from "../resources/api/os";

//Tauri
import { sendNotification } from "@tauri-apps/api/notification";

//Components
import CheckBox from "./components/checkbox";
import FontSelector from "./components/font";

import { BiMoon, BiSun } from "react-icons/bi";
import { BsCodeSlash, BsFonts, BsWindowSidebar } from "react-icons/bs";
import { FiDownload } from "react-icons/fi";
import SidebarSelector from "./components/sidebar";
import { getVersion } from "@tauri-apps/api/app";
import { invoke } from "@tauri-apps/api/tauri";

interface InitProps {
  dark: boolean;
  setDark: Function;
  auth: Auth;
  setDev: Function;
  font: string;
  setFont: Function;
  autoUpdate: boolean;
  setAutoUpdate: Function;
  sidebar: string;
  setSidebar: Function;
}

export default function Init(props: InitProps) {
  const customStyles = {
    content: {
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      marginRight: "-50%",
      transform: "translate(-50%, -50%)",
      maxWidth: "35%",
      minWidth: "35%",
      maxHeight: "30%",
      minHeight: "30%",
      transition: "all 500ms linear",
      borderRadius: "20px",
      borderColor: props.dark ? "rgb(55, 65, 81)" : "rgb(209, 213, 219)",
      backgroundColor: props.dark ? "rgb(55, 65, 81)" : "rgb(209, 213, 219)",
    },
    overlay: {
      backgroundColor: !props.dark
        ? "rgb(55, 65, 81, 0.5)"
        : "rgb(107, 114, 128, 0.75)",
      opacity: "1",
      zIndex: 1000,
    },
  };
  Modal.setAppElement("body");
  const [user, setUser] = useState(props.auth.currentUser as User);
  const [show, setShow] = useState(false);
  const [dev, setDev] = useState(
    user?.displayName?.startsWith("(dev)") as boolean
  );

  const [ver, setVer] = useState("0.9.0");

  useEffect(() => {
    getVersion().then(setVer).catch(() => {});
  }, []);

  async function Update() {
    const toast = Toast("Please Wait...", "warn", "never");
    try {
      if (props.auth?.currentUser?.emailVerified) {
        setShow(true);
        await updateProfile(user, {
          displayName: !dev
            ? `(dev)${user?.displayName}`
            : user?.displayName?.replace("(dev)", ""),
        });
        toast?.edit(
          `Successfully ${!dev ? "enabled" : "disabled"} developer mode!`,
          "success"
        );
        setUser(props.auth.currentUser as User);
        setDev(!dev);
        props.setDev(!dev);
        setShow(false);
      } else {
        toast?.edit("Please verify your email!", "danger");
      }
    } catch (_e) {
      toast?.edit("Failed to enable developer mode!", "danger");
      sendNotification("Could not update data!");
    }

    setTimeout(() => {
      toast?.unmount();
    }, 5000);
  }

  function darkMode(classes: Array<string>, dark: boolean) {
    return classes.map((c) => c + (dark ? "-d" : "")).join(" ");
  }

  function openUrl(url: string) {
    let toast = Toast("Please Wait...", "warn", "never");

    function unMount() {
      const timer = setTimeout(() => {
        clearTimeout(timer);
        toast?.unmount();
      }, 1500);
    }

    invoke("open", {
      url
    })
      .then(() => {
        toast?.edit("Opened in default browser", "success");
        unMount();
      })
      .catch(() => {
        toast?.edit(`Could not open ${url}`, "danger");
        unMount();
      });
  }

  return (
    <>
      <Modal isOpen={show} style={customStyles}>
        <div className="flex flex-col items-center text-center justify-center">
          <div className="my-auto">
            <h1
              className={`block mt-[45%] text-3xl ${
                props.dark ? "text-slate-300" : "text-slate-900"
              }`}
            >
              Please wait...
            </h1>
          </div>
        </div>
      </Modal>

      <div className={darkMode(["menu"], props.dark)}>
        <h1 className={`mt-3 text-3xl ${props.dark? "text-white" : "text-slate-700"} mr-auto ml-3`}>General</h1>

        <CheckBox
          dark={props.dark}
          title="Dark Mode"
          description="Enables or disables dark mode"
          Icon={props.dark ? BiSun : BiMoon}
          onClick={() => props.setDark(!props.dark)}
          active={props.dark}
        />

        <FontSelector
          Icon={BsFonts}
          dark={props.dark}
          initial={props.font}
          onChange={(e) => {
            props.setFont(e.target.value);
          }}
        />

        <SidebarSelector
          dark={props.dark}
          Icon={BsWindowSidebar}
          initial={props.sidebar}
          onChange={(e) => {
            props.setSidebar(e.target.value);
          }}
        />

        <h1 className={`mt-3 text-3xl ${props.dark? "text-white" : "text-slate-700"} mr-auto ml-3`}>Advanced</h1>

        <CheckBox
          dark={props.dark}
          title="Auto Update Apps"
          description="Automatically update apps when I launch AHQ Store"
          Icon={FiDownload}
          onClick={() => {
            props.setAutoUpdate(!props.autoUpdate);
          }}
          active={props.autoUpdate}
        />

        <CheckBox
          dark={props.dark}
          title="Developer Mode"
          description={
            props.auth?.currentUser?.emailVerified
              ? "Allows you to publish windows apps"
              : "(DISABLED, VERIFY EMAIL) Allows you to publish windows apps"
          }
          Icon={BsCodeSlash}
          onClick={() => Update()}
          disabled={!props.auth?.currentUser?.emailVerified}
          active={dev}
        />

        <h1 className={`mt-3 text-3xl ${props.dark? "text-white" : "text-slate-700"} mr-auto ml-3`}>About</h1>

        <div className="flex mx-auto w-[98%] h-auto items-center justify-center">
          <CheckBox
            dark={props.dark}
            title="OS"
            description={`You are running Windows ${getWindowsName()}`}
            Icon={getWindows()}
            onClick={() => {}}
            disabled={true}
            active={true}
            noCheckbox={true}
          />

          <div className="w-[1.2rem]"></div>

          <CheckBox
            dark={props.dark}
            title="Build"
            description={`AHQ Store v${ver} (Build ${versionToBuild(ver)})`}
            Icon={"/logo192.png"}
            onClick={() => {
              openUrl("https://ahq-store.ml");
            }}
            disabled={true}
            active={true}
            noCheckbox={true}
          />
        </div>
        <div className="flex mx-auto w-[98%] h-auto items-center justify-center">
          <CheckBox
            dark={props.dark}
            title="Frontend Framework"
            description={`React (TypeScript)`}
            Icon={"/react.webp"}
            onClick={() => {
              openUrl("https://react.dev");
            }}
            disabled={true}
            active={true}
            noCheckbox={true}
          />

          <div className="w-[1.2rem]"></div>

          <CheckBox
            dark={props.dark}
            title="Backend Framework"
            description={`Tauri (Rust)`}
            Icon={"/tauri.svg"}
            onClick={() => {
              openUrl("https://tauri.app");
            }}
            disabled={true}
            active={true}
            noCheckbox={true}
          />
        </div>
        <div className="flex mx-auto w-[98%] h-auto items-center justify-center mb-5">
          <CheckBox
            dark={props.dark}
            title="Developer"
            description={`AHQ (github.com/ahqsoftwares)`}
            Icon={"/ahq.png"}
            onClick={() => {
              openUrl("https://github.com/ahqsoftwares");
            }}
            disabled={true}
            active={true}
            noCheckbox={true}
            roundedImage={true}
          />

          <div className="w-[1.2rem]"></div>

          <CheckBox
            dark={props.dark}
            title="Github Repo"
            description={`Click to open in default browser`}
            Icon={props.dark ? "/github-dark.png" : "/github.png"}
            onClick={() => {
              openUrl("https://github.com/ahqsoftwares/tauri-ahq-store");
            }}
            disabled={true}
            active={true}
            noCheckbox={true}
          />
        </div>
      </div>
    </>
  );
}
