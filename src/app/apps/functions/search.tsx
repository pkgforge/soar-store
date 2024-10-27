import { useEffect, useState } from "react";

import fetchApps, {
  appData,
} from "../../resources/api/fetchApps";
import AppCard from "../components/app_card";

import { search } from "@/app/resources/core";

interface SearchProps {
  query: string;
  set: Function;
  show: Function;
  dark: boolean;
  isAdmin: boolean;
  hide: boolean;
}

export default function Search(props: SearchProps) {
  const { query, hide, set, show, dark } = props;

  const [matches, setMatches] = useState<appData[]>([]);
  const [searched, setSearched] = useState<boolean>(false);

  useEffect(() => {
    setMatches([]);
    setSearched(false);

    (async () => {
      const results = await getDataFromMatches(await getMatches(query));

      setMatches(results as appData[]);
      setSearched(true);
    })();
  }, [query]);


  return (
      <div
        className={`${hide ? "hidden" : ""} w-[100%] h-[auto] overflow-scroll search-app-grid ${
          matches.length == 0 ? "special-app-grid" : ""
        }`}
      >
        {matches.map((app) => {
          return (
            <AppCard
              id={app.appId}
              key={app.appId}
              dark={dark}
              onClick={() => {
                set(app.appId);
                show();
              }}
            />
          );
        })}
        {matches.length === 0 ? (
          <div
            className={`mx-auto my-2 flex items-center justify-center ${
              dark ? "text-slate-200" : ""
              }`}
          >
            <span className="block">
              {searched ? (
                "0 Apps Found"
              ) : (
                <div className="flex w-[100%] justify-center">
                  <span className="dui-loading dui-loading-spinner dui-loading-lg" />
                  <span className="ml-2">Just a moment...</span>
                </div>
              )}
            </span>
          </div>
        ) : (
          <></>
        )}
        <div className="h-[5rem]"></div>
      </div>
    );
}

async function getMatches(query: string): Promise<string[]> {
  const matches = await search<{ id: string }[]>(query);
  const finalmatches = matches.map(({ id }) => id);

  finalmatches.length = 40;

  return finalmatches;
}

async function getDataFromMatches(matches: Array<string>) {
  return fetchApps(matches);
}

export { getDataFromMatches };
