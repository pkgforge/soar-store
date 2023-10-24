import { invoke } from "@tauri-apps/api/tauri";

let windowsVersion = "";
let name = "";
let development = false;

export function init() {
  const windows95 =
    "data:image/png;base64,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";
  const windows7 =
    "data:image/png;base64,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";
  const windows11 =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAABmJLR0QA/wD/AP+gvaeTAAABCElEQVRYhe2WwUoDMRCGv2S3LfQmeqmlF4/Vm/psBR9A8N32JsWzSF0KRU+i2zUbD+tJUulkQCzMdwpD/pmPkEDAMIxfccnqYllBvBT2qmnaOaVv8cUDjpkwX3F3cf2zWKb3iuUAJoyGU1x4J4rlAK5SRZ/R6E8xQS0mqMUEtZigFhPUskuwzujVUnQbPsIL8CZOR55S5fRnwXXnwJlogC+fuZ2vAVhUU9zwWJQPcb2/oJZiPKb7PBJlSvdK4uTTgtEvgYloQOhabu5n3+tH8ANRvr9Wp/sJSuV6BgR/0i+jVG7nzIN9xf8GE9RiglpMUIsJajlYwSqjV02zXdFsV+T9J3NmGobxBQNuOlenTHdjAAAAAElFTkSuQmCC";
  const windows10 =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAABmJLR0QA/wD/AP+gvaeTAAABqElEQVRYhe3Yv2oUURSA8d/dDYYUBhZEAhbK7myT1crKzsbGxlhEbSx9BxsfwFoIPoCVNgZjQPAxtra3shAJ2ezOsciw7J9RF8fdjTAfDJeZuXPux5nD3OFQU7Ne0tpW/hBXhMxIhkzSFXIP09PJaRtLlTiKljNtDW2hLRUjN43sYDpFSX82RHXBw7jsQfruMO4JdyWZXCbJDG1LiGJu/C5QOYsJTmYi15Psoo2u8AmPhGfYF/5p4cwLvo/HuE1RG2SGtsaZWHHVlmXwBXqr1fg1jXUL/IlasCplgn/xMVge/2UGLxT1K67KhRcs20meCFsLR8h9AyPPNbysZJOczF6aF2zKDYpFF2HDj/E4rCB3zmA+/CwjbzXdWjhkeOf8b+aVpv1KevSZXvvC12AtWJVasCq1YFVqwaqU7cWvhTuSDjq4umKnKeYF99IBDsbnx7HpxDVNbUkPuxNtjOurF5zlfjrFl+L4PHXvODaFFkjeyH3V0BE6uIFLVQWX2yc4ipZB0SpJ2oyPLrZLnujbS1M/C+trv32MHacyzXGtZ3Kj2fZbTc26+QkUeVzllrl4UwAAAABJRU5ErkJggg==";

  invoke<boolean>("is_development").then((value) => (development = value));

  invoke<string>("get_windows")
    .then((version) => {
      name = version;
      if (version === "7") {
        windowsVersion = windows7;
      } else if (version === "8" || version === "8.1" || version === "10") {
        windowsVersion = windows10;
      } else if (version == "11") {
        windowsVersion = windows11;
      }
    })
    .catch((e) => {
      console.error(e);
      windowsVersion = windows95;
    });
}

export default function getWindows() {
  return windowsVersion;
}

export function getWindowsName() {
  return name;
}

export function versionToBuild(version: string) {
  const [major, minor, patch] = version.split(".");

  return String(
    Number(major) * 10000 +
      Number(minor) +
      Number(`0.${patch}`) +
      (development ? "-next" : ""),
  );
}
