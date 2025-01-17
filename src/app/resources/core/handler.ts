import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { Downloaded, ServerResponse, interpret } from "./structs";
import { Prefs } from ".";
import { Library } from "./installer";

const appWindow = getCurrentWebviewWindow();
let ref_counter = 1;

const WebSocketMessage = {
  GetApp: (app_id: string) => `{"GetApp":[{*ref_id},"${app_id}"]}`,
  InstallApp: (app_id: string) => `{"InstallApp":[{*ref_id},"${app_id}"]}`,
  UninstallApp: (app_id: string) => `{"UninstallApp":[{*ref_id},"${app_id}"]}`,
  ListApps: () => `{"ListApps":{*ref_id}}`,
  GetPrefs: () => `{"GetPrefs":{*ref_id}}`,
  SetPrefs: (prefs: Prefs) =>
    `{"SetPrefs":[{*ref_id}, ${JSON.stringify(prefs)}]}`,
  GetSha: () => `{"GetSha":{*ref_id}}`,
  GetLibrary: () => `{"GetLibrary":{*ref_id}}`,
  RunUpdate: `{"RunUpdate":{*ref_id}}`,
  UpdateStatus: `{"UpdateStatus":{*ref_id}}`,
};

type u64 = Number;

type CacheValues = {
  data: string;
  ref_id: u64;
  resolve: (value: ServerResponse) => void;
}[];

let send: CacheValues = [];
let toResolve: CacheValues = [];

export function sendWsRequest(
  data: string,
  result: (value: ServerResponse) => void,
) {
  queueAndWait(data, result);
}

export function engageWs0(result: (value: ServerResponse) => void) {
  toResolve.push({
    data: "%worker",
    resolve: result,
    ref_id: 0,
  });
}

export { WebSocketMessage };

function queueAndWait(data: string, result: (value: ServerResponse) => void) {
  ref_counter++;

  send.push({
    data: data.replace("{*ref_id}", String(ref_counter)),
    resolve: result,
    ref_id: ref_counter,
  });
}

export function runner() {
  setInterval(() => {
    for (let i = 0; i < send.length; i++) {
      const req = send[i];

      toResolve.push(req);
      appWindow.emit("ws_send", req.data);
    }
    send = [];
  }, 1);
}

let prog = 1;
appWindow.listen<string[]>("ws_resp", async ({ payload: pload }) => {
  for (let i = 0; i < pload.length; i++) {
    const payload = pload[i];
    try {
      const toObj = await interpret(payload);

      if (toObj) {
        if (toObj.method == "Library") {
          const data = toObj.data as Library[];

          if (data.length == 0) {
            invoke("set_progress", {
              state: 0
            });
          } else {

            data.forEach((d) => {
              if (d.to == "Install" && d.status == "Downloading...") {
                invoke("set_progress", {
                  state: 2,
                  c: Number(d.progress.toFixed(0)),
                  t: 100,
                });
              } else if (d.status == "Installing..." || d.status == "Uninstalling..." || d.status == "Scanning for Viruses!") {
                invoke("set_progress", {
                  state: 1,
                });
              }
            });
          }
          prog = 1;
        } else {
          if (prog != 0) {
            invoke("set_progress", {
              state: 0,
            });
            prog = 0
          }
        }

        toResolve = toResolve.filter(({ ref_id, resolve }) => {
          if (ref_id == toObj.ref) {
            resolve(toObj);
          }
          if (toObj.method == "TerminateBlock" && ref_id != 0) {
            console.log("Removing ", ref_id);
            return false;
          }

          return true;
        });
      }

    } catch (e) {
      console.log(pload);
      console.log(e);
    }
  }
});
