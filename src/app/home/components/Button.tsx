import { IconType } from "react-icons";

interface ButtonProps {
  dark: boolean;
  Icon: IconType | string;
  title: String;
  description: String;
  no50?: boolean;
  onClick: Function;
  calibrate?: string;
}

export default function Button(props: ButtonProps) {
  const { Icon, title, description, onClick, no50, calibrate } = props;

  return (
    <div
      className="h-[5.5rem] w-[20.5rem] m-[1rem] border-[1px] border-base-content dui-btn dui-btn-ghost bg-[var(--fallback-bc)] no-animation backdrop-blur-3xl"
      style={{
        cursor: "pointer",
        transition: "all 125ms linear",
      }}
      onClick={() => onClick()}
    >
      <div className="my-auto ml-3 mr-auto">
        {typeof Icon === "string" ? (
          <img
            alt="Logo"
            width={"48px"}
            height={"48px"}
            style={no50 ? {} : { borderRadius: "50%" }}
            className="shadow-2xl"
            draggable={false}
            src={Icon}
          ></img>
        ) : (
          <Icon size="3em" />
        )}
      </div>
      <div className="flex flex-col ml-3 mr-auto">
        <h1 className="text-3xl">{title}</h1>
        <h2 className={calibrate ? `ml-[${calibrate}px]` : ""}>
          {description}
        </h2>
      </div>
    </div>
  );
}
