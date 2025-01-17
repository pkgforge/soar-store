/*Main Modules
 */
import ReactDOM from "react-dom/client";
import reportWebVitals from "./reportWebVitals";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

/*Tauri
 */
import {
  isPermissionGranted,
  requestPermission,
} from "@tauri-apps/plugin-notification";
import { invoke } from "@tauri-apps/api/core";
import {
  getCurrentWebviewWindow,
  WebviewWindow,
} from "@tauri-apps/api/webviewWindow";

/*Apps
 */
import Store, { AppProps } from "./app/index";

const appWindow = (() => {
  try {
    return getCurrentWebviewWindow();
  } catch (_) { }
})() as WebviewWindow;

/*
 */
import { init } from "./app/resources/api/os";

/*Firebase
 */

/*Global CSS
 */
import "./index.css";
import "./globals.css";

import initDeveloperConfiguration from "./app/resources/utilities/beta";

import { getAppVersion, loadAppVersion } from "./app/resources/api/version";
import { genAuth } from "./auth";
import { tryAutoLogin } from "./auth/login";
import { Loading } from "./config/Load";

import { AiOutlineReload } from "react-icons/ai";
import { TbExternalLink } from "react-icons/tb";
import { GrUpdate } from "react-icons/gr";
import { FaGithub } from "react-icons/fa6";
import { MdLabelImportant } from "react-icons/md";

document.body.setAttribute("native-scrollbar", "0");

const auth = genAuth();

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

let list = [
  [false, false, "F5"], //Reload
  [true, false, "R"], //Reload
  [true, true, "R"], //Reload
  [true, true, "E"], //Find
  [true, true, "X"], //Useless Screenshot
  [true, false, "F"], //Find
  [true, false, "G"], //Find
  [true, false, "G"], //Find
  [true, false, "P"], //Print
  [true, true, "P"], //Print
  [true, false, "U"], //Inspect Page
  [true, true, "B"], // Favourites
  [true, false, "S"], //Save
];

if (localStorage.getItem("dsc-rpc") == "true") {
  invoke("dsc_rpc");
}

getCurrentWebviewWindow()
  .listen("update", () => {
    loadRender(false, "Update available, updating!");
  })
  .catch(() => { });

window.addEventListener("keydown", (e) => {
  list.forEach(([ct, sh, key]) => {
    if (e.ctrlKey == ct && e.shiftKey == sh && e.key == key) {
      e.preventDefault();
    }
  });
});

/**
 * Loads updater
 */
function loadRender(unsupported: boolean, text = "Loading") {
  root.render(
    <ContextMenu>
      <ContextMenuTrigger>
        <Loading unsupported={unsupported} text={text} />
      </ContextMenuTrigger>
    </ContextMenu>,
  );
}

if ((window as { __TAURI_INTERNALS__?: string }).__TAURI_INTERNALS__ == null) {
  loadRender(true);
} else {
  if (appWindow.label == "main") {
    initDeveloperConfiguration();

    (async () => {
      const ptf = await invoke("get_windows").catch(() => "10");

      if (ptf == "11") {
        document.querySelector("html")?.setAttribute("data-os", "win32");
      }
      setTimeout(async () => {
        appWindow.setDecorations(true).catch(console.log);

        appWindow.show();
        if (!(await appWindow.isMaximized())) {
          appWindow.maximize();
        }
      }, 500);
    })();
    loadAppVersion();
    init();

    const unlisten = appWindow.listen("needs_reinstall", () => {
      unlisten.then((f) => f());
      setInterval(
        () => loadRender(false, "Oops! Soar Store needs reinstall.."),
        10,
      );
    });

    /*Logic
     */
    (async () => {
      let permissionGranted = await isPermissionGranted();

      if (!permissionGranted) {
        const permission = await requestPermission();
        permissionGranted = permission === "granted";
      }
    })();

    loadRender(false);

    (async () => {
      console.log("Running Manage()");

      Manage();
    })();

    window.addEventListener("offline", () => {
      loadRender(false, "Offline, waiting for network");
    });

    window.addEventListener("online", () => {
      loadRender(false, "Back online!");
      setTimeout(() => {
        Manage();
      }, 1000);
    });

    async function Manage() {
      tryAutoLogin(auth).catch(() => { });
      loadRender(false, "Launching Store...");
      setTimeout(() => {
        StoreLoad(Store, { auth });
      }, 500);
    }

    /**
     * Load a Store Component on the DOM
     * @param Component
     * @param prop
     */
    function StoreLoad(
      Component: (props: AppProps) => any,
      { auth }: AppProps,
    ) {
      const data = {
        auth,
      };

      root.render(
        <>
          <ContextMenu>
            <ContextMenuTrigger>
              <Component {...data} />
            </ContextMenuTrigger>
            <ContextMenuContent className="w-64">
              <ContextMenuItem disabled inset>
                <img src="/favicon.ico" className="mr-1" style={{ "width": "1.2em", "height": "1.2em", "filter": "grayscale()" }} />
                <span className="font-sans font-extrabold">Soar Store v{getAppVersion()}</span>
              </ContextMenuItem>

              <ContextMenuSeparator />

              <ContextMenuItem inset onClick={() => window.location.reload()}>
                <AiOutlineReload size="1.2em" className="mr-1" />
                Reload
              </ContextMenuItem>

              <ContextMenuItem inset onClick={() => invoke("check_install_update")}>
                <GrUpdate size="1em" className="mr-1" />
                Check for Updates
              </ContextMenuItem>

              <ContextMenuSeparator />

              <ContextMenuItem disabled inset>
                <MdLabelImportant size="1.2em" className="mr-1" />
                Important URLs
              </ContextMenuItem>

              <ContextMenuItem inset onClick={() => invoke("open", { url: "https://ahqstore.github.io" })}>
                <TbExternalLink size="1.2em" className="mr-1" />
                Site
              </ContextMenuItem>

              <ContextMenuItem inset onClick={() => invoke("open", { url: "https://github.com/ahqsoftwares/tauri-ahq-store" })}>
                <FaGithub size="1.2em" className="mr-1" />
                GitHub Repo
              </ContextMenuItem>

              <ContextMenuItem inset onClick={() => invoke("open", { url: "https://github.com/ahqstore" })}>
                <FaGithub size="1.2em" className="mr-1" />
                GitHub Organization
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </>,
      );
    }

    reportWebVitals();
  } else {
    setInterval(() => {
      appWindow.setFullscreen(false);
    }, 2000);
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.querySelector("html")?.setAttribute("data-theme", "night");
    }
    document
      .querySelectorAll("*")
      .forEach((v) => v.setAttribute("data-tauri-drag-region", ""));
    root.render(
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            data-tauri-drag-region
            className="bg-base-100 text-base-content border-base-content w-screen h-screen flex flex-col"
          >
            <div
              data-tauri-drag-region
              className="bg-base-300 py-2 flex text-neutral-content w-full items-center text-center justify-center mb-auto"
            >
              <img
                data-tauri-drag-region
                src="/favicon.ico"
                width={20}
                height={20}
              />
              <span
                data-tauri-drag-region
                className="ml-1 font-sans  font-extrabold"
              >
                Soar Store
              </span>
            </div>
            <div className="mb-auto flex flex-col justify-center items-center text-center">
              <h1 data-tauri-drag-region>Enter this code</h1>
              <h1 data-tauri-drag-region className="font-extrabold text-2xl">
                {window.location.pathname.replace("/", "")}
              </h1>
            </div>
          </div>
        </ContextMenuTrigger>
      </ContextMenu>,
    );
  }
}
