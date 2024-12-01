//Worker
import { BiArrowBack } from "react-icons/bi";
import { FiSearch as FcSearch } from "react-icons/fi";

interface AppDataPropsModal {
  shown: boolean;
  change: Function;
  dark: Boolean;
  search: string;
  hide: boolean;
  setQuery: (text: string) => void;
  searchText: (text: string) => void;
}

export default function SearchModal(props: AppDataPropsModal) {
  const { hide, shown, dark, change, setQuery, searchText, search } = props;
  return (
    <>
      {shown ? (
        <div className={`flex flex-col w-[100%] h-[auto] mt-3 p-2 pb-4 px-4 ${hide ? "hidden" : ""}`}>
          <div className={`flex ${dark ? "text-slate-300" : "text-slate-800"}`}>
            <button
              onClick={() => {
                change();
              }}
              style={{
                color: "white",
                backgroundColor: "rgb(96,70,255)",
                borderTopRightRadius: "0",
                borderBottomRightRadius: "0",
                transition: "all 250ms linear",
              }}
              className={`rounded-md p-2`}
            >
              <BiArrowBack size="1.5em" />
            </button>
            <input
              className={`search-input search-input-m-modified search-input-modified ${dark ? "style-input-d search-input-m-modified-d" : ""
                } mx-auto`}
              placeholder={`Search the whole of Soar Store`}
              value={search}
              onKeyUp={(e) => {
                if (e.key == "Enter") {
                  setQuery(search);
                }
              }}
              onChange={(e) => {
                searchText(e.target.value);
              }}
              style={{
                borderTopLeftRadius: "0",
                borderBottomLeftRadius: "0",
              }}
              autoComplete={"off"}
              id="special-modal"
            />
            <button
              className={`search-input search-input-search-icon ${dark ? "style-input-d" : ""
                } max-w-[50px] min-w-[50px] p-0 m-0 flex justify-center items-center text-center`}
              type="submit"
              id={"search-btn"}
              onClick={() => {
                setTimeout(() => {
                  if (search.length >= 1) {
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
      ) : (
        <></>
      )}
    </>
  );
}
