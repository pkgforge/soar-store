/*
React Native
*/
import { useState } from "react";
import { FiSearch as FcSearch } from "react-icons/fi";
import { Auth } from "../../auth";
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
import { FaInfoCircle } from "react-icons/fa";

/*
Interfaces
*/
interface AppsProps {
  dark: boolean;
  auth: Auth;
  apps: Array<any>;
  isAdmin: boolean;
}

export default function Apps(props: AppsProps) {
  const { dark, apps, isAdmin } = props;

  const [shown, showModal] = useState(false),
    [search, searchText] = useState(""),
    [toSearch, setToSearch] = useState(""),
    [enter, setEnter] = useState(false),
    [data, setData] = useState("");

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
    <div className="menu">
      {shown && <Modal
        isAdmin={isAdmin}
        shown={shown}
        dark={dark}
        change={change}
        installData={data}
      />}
      <SearchModal
        shown={enter}
        dark={dark}
        change={changeEnter}
        search={search}
        hide={shown}
        setQuery={setToSearch}
        searchText={(string) => {
          searchText(string);
        }}
      />
      {!enter ? (
        <>
          <div
            className={`${shown ? "hidden" : ""} w-[40%] mt-2`}
          >
            <div
              className="w-[100%] flex border-[1px] border-base-content rounded-md"
              id="get-width"
            >
              <input
                className={`search-input search-input-m-modified ${
                  dark ? "style-input-d search-input-m-modified-d" : ""
                }`}
                placeholder={`Search`}
                autoCorrect={"off"}
                autoCapitalize={"off"}
                value={search}
                style={{
                  borderTopRightRadius: "0",
                  borderBottomRightRadius: "0",
                  width: "100%",
                }}
                onChange={(e) => {
                  searchText(e.target.value);
                }}
                onKeyUp={(e) => {
                  if (e.key === "Enter") {
                    if (search.length >= 1) {
                      setEnter(true);
                      setToSearch(search);
                    }
                  } else {
                    setEnter(false);
                    setToSearch("");
                  }
                }}
                autoComplete={"off"}
              ></input>
              <button
                className={`search-input search-input-search-icon ${
                  dark ? "style-input-d" : ""
                } max-w-[50px] min-w-[50px] p-0 m-0 flex justify-center items-center text-center`}
                type="submit"
                id={"search-btn"}
                onClick={() => {
                  setTimeout(() => {
                    if (search.length >= 1) {
                      setEnter(true);
                      searchText(search);
                    }
                  }, 0);
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
          </div>

          <div className={`${shown ? "hidden" : ""} appss`}>
            {apps.length === 0 ? (
              <div
                className={`flex justify-center text-center items-center mt-9 ${dark ? "text-yellow-400" : "text-yellow-600"}`}
              >
                <FaInfoCircle size={"3em"} />
                <h1 className="ml-2 apps-text">No apps!</h1>
              </div>
            ) : (
              <></>
            )}

            {apps.map((filess: [string, string[]]) => {
              try {
                const [alt, data] = filess;

                const apps = data;
                return (
                  <Layer alt={alt} key={keyGen()}>
                    {apps.map((data) => {
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
        <Search
            query={toSearch}
          set={setData}
          show={change}
            dark={dark}
            hide={shown}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
