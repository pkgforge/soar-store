import Card from "./components/Card";

import { TbScript } from "react-icons/tb";

import { IoMdInformationCircle } from "react-icons/io";
import { FaCampground } from "react-icons/fa";

export default function Package() {
  return (
    <div className="menu">
      <div role="alert" className="w-[98%] dui-alert dui-alert-info mt-2">
        <IoMdInformationCircle size={"1.5rem"} />
        <span>The following lists some tools that may turn out useful</span>
      </div>

      <div className="px-2 py-5 w-[98%] grid gap-3 grid-cols-3">
        <Card
          title="Lead Lang"
          body="The Lead Programming Language by the developers of Soar Store"
          Icon={TbScript}
          installed={false}
          cannotRemove={true}
        />

        <Card
          title="Dev Camp (Not Ready)"
          body="Develop Soar Store apps!"
          Icon={FaCampground}
          installed={false}
          cannotRemove={true}
        />
      </div>
    </div>
  );
}
