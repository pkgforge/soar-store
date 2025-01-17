import { ApplicationData } from "../../resources/api/fetchApps";

interface LoadProps extends ApplicationData {
  show: Function;
  set: Function;
  dark: boolean;
  isAdmin: boolean;
}

export default function Load(props: LoadProps) {
  const { appDisplayName, description, show, set, appId, dark } = props;

  return (
    <div
      className="flex w-[100%] h-[3rem] shoadow-2xl rounded-xl pl-3"
      style={{ cursor: "pointer" }}
      onClick={() => {
        set(appId);
        show();
      }}
    >
      <img
        src={""}
        alt="Logo"
        style={{ height: "2rem", marginTop: "auto", marginBottom: "auto" }}
      />
      <div className="ml-2">
        <h1 className={dark ? "text-white" : "text-black"}>{appDisplayName}</h1>
        <h2>
          {description?.length > 30
            ? `${description?.substring(0, 30)}...`
            : description}
        </h2>
      </div>
    </div>
  );
}
