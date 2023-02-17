/*
React Native
*/
import { useState, useEffect } from "react";
import { FiSearch as FcSearch } from "react-icons/fi";
import { Auth } from "firebase/auth";

/*
Functions
*/
import Search from "./functions/search";

/*
Components
*/
import Layer from "./components/layer";
import Card from "./components/app_card";
import Modal from "./components/app_modal";
import SearchModal from "./components/search_modal";

/*
StyleSheets
*/
import "./index.css";
import { getData } from "../resources/utilities/database";

/*
Interfaces
*/
interface AppsProps {
  dark: boolean;
  auth: Auth;
  apps: Array<any>;
}

function darkMode(classes: Array<string>, dark: boolean) {
  return classes.map((c) => c + (dark ? "-d" : "")).join(" ");
}

export default function Apps(props: AppsProps) {
  const { dark, apps } = props;

  const [shown, showModal] = useState(false),
    [search, searchText] = useState(""),
    [enter, setEnter] = useState(false),
    [data, setData] = useState("");

  function Fix() {
    const element = document.querySelector("#search-result") as any;
    if (element) {
      element.style = `width: ${
        document.querySelector("#get-width")?.clientWidth
      }px;`;
    }
  }

  window.addEventListener("resize", () => {
    Fix();
  });
  useEffect(() => {
    Fix();
  });

  function change() {
    showModal(!shown);
  }

  function changeEnter() {
    setEnter(!enter);
  }

  let key = 0;
  function keyGen() {
    key += 1;
    return key;
  }

  return (
    <div className={darkMode(["menu"], dark)}>
      <Modal shown={shown} dark={dark} change={change} installData={data} />
      <SearchModal
        shown={enter}
        dark={dark}
        change={changeEnter}
        search={search}
        searchText={(string) => {
          searchText(string);
        }}
      />
      {!enter ? (
        <>
          <div
            className="w-[40%] mt-2"
            onBlur={() => {
              let searchOnEnter = getData("enableSearchOnEnter");

              if (searchOnEnter) {
                setTimeout(() => {
                  setEnter((enter) => {
                    if (!enter) {
                      searchText("");
                    }
                    return enter;
                  });
                }, 100);
              }
            }}
          >
            <div className="w-[100%] flex" id="get-width">
              <input
                className={`search-input search-input-m-modified ${
                  dark ? "style-input-d search-input-m-modified-d" : ""
                }`}
                placeholder={`Quick Search`}
                id={"quick-search"}
                autoCorrect={"off"}
                autoCapitalize={"off"}
                value={search}
                style={{
                  borderTopRightRadius: "0",
                  borderBottomRightRadius: "0",
                }}
                onChange={(e) => {
                  searchText(e.target.value);
                }}
                onKeyUp={(e) => {
                  let data = getData("enableSearchOnEnter");
                  if (e.key === "Enter") {
                    if (data) {
                      if (search.length >= 1) {
                        setEnter(true);
                      }
                    }
                  } else {
                    setEnter(false);
                  }
                }}
                autoComplete={"off"}
              ></input>
              <button
                className={`search-input search-input-search-icon ${
                  dark ? "style-input-d" : ""
                } max-w-[50px] min-w-[50px] p-0 m-0`}
                type="submit"
                id={"search-btn"}
                onClick={() => {
                  let searchBiggerBoxEnabled = getData("enableSearchOnEnter");

                  if (searchBiggerBoxEnabled) {
                    setTimeout(() => {
                      if (search.length >= 1) {
                        setEnter(true);
                        searchText(search);
                      }
                    }, 0);
                  }
                }}
                style={{
                  borderColor: "rgb(96,70,255)",
                  color: "white",
                  backgroundColor: "rgb(96,70,255)",
                  borderTopLeftRadius: "0",
                  borderBottomLeftRadius: "0",
                }}
              >
                {" "}
                <FcSearch size={"1.2em"} />{" "}
              </button>
            </div>
            <div
              className={`absolute ${
                !dark ? "bg-gray-100 text-black" : "bg-gray-800 text-white"
              } rounded-md shadow-2xl mt-1`}
              id="search-result"
            >
              {search.length > 0 && !enter ? (
                <Search
                  key={"YourBestSearchAlgorithm"}
                  query={search}
                  set={setData}
                  show={change}
                  dark={dark}
                />
              ) : (
                <></>
              )}
            </div>
          </div>

          <div className="appss">
            {apps.length === 0 ? (
              <>
                <h1 className="apps-text">Loading Your Apps...</h1>
              </>
            ) : (
              <></>
            )}

            {apps.map((filess: any) => {
              try {
                const [alt, data] = filess;
                const apps: any = data;
                return (
                  <Layer alt={alt as string} key={keyGen()}>
                    {apps.map((data: string) => {
                      try {
                        return (
                          <Card
                            key={keyGen()}
                            id={data}
                            onClick={() => {
                              setData(data);
                              change();
                            }}
                            dark={dark}
                          />
                        );
                      } catch (e) {
                        return <div key={keyGen()}></div>;
                      }
                    })}
                  </Layer>
                );
              } catch (e) {
                return <div key={keyGen()}></div>;
              }
            })}
          </div>
        </>
      ) : (
        <></>
      )}
    </div>
  );
}
