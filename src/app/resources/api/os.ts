import { invoke } from "@tauri-apps/api/core";

let windowsVersion = "";
let name = "";
let development = false;

export function init() {
  const windows95 =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAABmJLR0QA/wD/AP+gvaeTAAAI50lEQVRYhe2YeXDV1RXHP+f+3pKNEAhUDJG8PARTGR0FQXYpVbC21GpHa1EsU5d2RB3t1BHLKNBOFau2LlDQWsqig8ogKq2lMsMu2AJFdoHkvRcCCVsICcnLW36/e/pHFkJA0LZip+P3r/e795xzP/fc5Xd+D77S/7mcs3X269fPn5mZuSEvL+9vx48frz1fUJ9HJhQK5QH07NlzZCgU6nbeAc7Rb2Ox2PFwODzUWvuBMSZwXqjaSD6t49DQ/mHP448XBrOvk5UrXYCCgoKsYDB4BxCPRqOvfamAh0f0yUmkA7kZ/lRdOpE1UNJ23dCamh+o6mxVnQ3MF5HeQE00Gl143gFbVDm4/4OqPFJQGAr12ry5xFp7YTKZ/CQQCHwI9ACesda+ISK5xhhfJBJZDtgvFLBiyFU3GMvN3ddvvLu1bdCg7oI3WNRWDjt8LKWqMwEcx/mN53lvNpt9CCxX1bHSpOlhxzyxz/VyHZG4qFY0NtlsMcasLCsr2/5vAe4fMCDfeJ4A2KApLFy34eMDA/vPQLgP9AERZ49V7eiIxgZXHZ0A/KjZ9SfAM0Au4F4TDN6zKpn806cOLrITeDWVSs3av39/42cGbAUdNGCeiHbsvm7DjZWD+l9vkQ7ql49N2u4EfKoy/uGamkKfiJcnTmJpIhEBHhCRE8DWIQH/mLXJVN9zJAmgCng0Go3OPydgcXHx/aqajsViL7e0VQzqe7FRJ2RwSj2xw0X0QZSEhYUGnm82mzHsUHW2ql4G+Do6zkOTcnPeSart6AHHPEuVtWxNpdmddj8NdH5WVtZ9O3bsqG9p8J3BaFk6nT4aDod7AMFIJLLX4MxDGGT9MoQ0jarytOJuNjhvtTi93ZhYpaotzxWLuuR2zxCnY/vgv62rP7g77XYL3eZyZL1xG8pNW4Zx8Xj8olAo9K1YLJY4YwbbZHKbqi78S3b2tE4ds8ZbSwojR0T1zwAG3wiLe40o1hVTObzqUBcRuVVVa0XkjQ8vyP+hinyjbcy0wujD1Sekq/UPfb0xA+DwWh+7X/Db1HFpfWmIyOJIJHIL4J3yJil5TF/oM1FHAuJ53vD8/PynxjQ2hoYdOrbpmzV1i8TqKIWIKoss6XHAVBV+1WCtzxgzEKgxxsjvunX+SEVGtJ/0B4lEXUq1Q9H33QykKT1fG+Zy9SsJk9Pz5M2kqjeFQqF7oN0SG2VOQwa7ek/SAr+fxkOvXuTz+/0fqWpGMpm8dNjh6iXAkts6BXdMCOTsbl6C2juOVPtU9abmMIv7q7kdOX115tQ31hq/ZHUblT5l3EBnpWCUx56ZJ/Olqn8/DXDnNNl8xRTNS1r22BS3Oo6zU1WfBmLGmPGqOhmoLrC+MRWu+3w9pK2y5ZjqXUApUJvlODNFmKvt4Pam3VSV511UcJ3r+ju061TYv+SUwmpNeXn55lbAfveqP96Z2cbjkTw4Wq0UbnuK4yUTY0UWFu6ZNjVWXDx3ORARkfnPHa+fAVzZHOwWoA7YDByelpPZ4xPXvdCP0MUIuaYpK7Pq4zGgd+H33NMOZvUGh/j+U3bb9JYfAtBniua4KfrvflJW9J6o4QyXQ8kAPY2yBdiK4bt49BKDNrzeK26Mt67Zf72IbFHVnzY/P55pzMhGa1sPR74xyZKAT9YnUja7p9UBLycy2wN+/FiQ6g2tGdxfVFRUvLK5QDlln/R5VIdawwrPEPJ7XGINo9SyXOBBhG8DK+NLhj/rww62vqwGkg1rSVQtABxVrdeSCeOCGTmrrXXTxks22niltbWfBKjdm6XW9YlR7TbKk+KxLpkFTYciXiGs/3EmnNwTk6LR6JMtD75QKBQCnojFYnf7M9nupgnv2sPBy3oSTwbYmJEi04OrUWoU5mSNWb0A6ADUpt8fuclL8A7gE5FNWVf+/HoFn9O0dTIdALUkFl1emRNI5Zf0SAU2Ls3g4DKH4nEuobEuFe/628IlHMf5Q9ukGVVNOo4zY8SIEebY7CLZ/ms5cOnF3OkKx3xJnk9ZstVyvQeDBbKa4QBe8+piU4D7gHutMRUK49svn61cWYMbL7jj2jr/W49XyYJJVVxSmPYic/xseiioVUudVjxVXVBaWnqkrb+vvLy8CqjyPO8hx3F+BhSrkCXwijjMwmWVQKGBZ40QU8tUC5r+5+R/ABOAOBDJvHWHQ1P5dYrS2547aoS8sSNPGICrSxIs+WWlM/3dPF5cnCfa5rg7jjOjvX/ribLWvici7wLeridlBkDJL3S0QDZQI8o6C28jIMpHWvpaqao+bYzBWvtXkeDDtLtbtOGA6vFdPUdcEXcLu7r+VhCjPHBjDW+vyaHiSCvC2rKysk2fCrhv374IQHFx8UvA/SIyIf3mxauB61T1SPC2ssdaACRdO1dVZ4lIjqq6/l7j30C5oX1wb8f0ciA0flTdad8+q7ZmtYUDeLG9zSmAzRIgCCw0xqz0PG8r4IjI7cZzqzy3YRrYE4n3RzlADoCqvue/avINCv5TItkUbvnizoVd0u6QPo2n3X1zl+WeHFTkQKdOnd6JRqPnBNRoNHovQDgcnkLTd/NRa+1l8bd6T2y2eQmoU9WpjuO4jY06z1l91w68VNNgWRcgub3Q5LFGvFTu+NEnMO3yF6nys2bbyetQVX+/adOm9BkSeMZyqylIJDIFmAI4xcXFrVMTkZWqukhEsNZWZGRnb7aVK3LOECITYOOeIAO/HuDSolRrx7xluehZrpbPBNiiHj16FInIIlWtV9UDwMg23a+o23Dn2fyXbshm6YZshl/eyORx1XTt6LFozcn5nOlqaatzftW1Vzgc7uW6rgfUdO3atb66ujrf5/PFS0tL6woLCzsHAoGwqvYFbm6eTOveDPqV/pckWLv95PJaa/u2FAb/FcDPo+a31OMiMp4z/4uxJhqNDj9bjHP99fEfKdaku6y11wKVZzB56VwxvlDAFpWXl69orrj3tmneX1RUtPhcvucFEKCsrKzCWjsaONjcNLOlpDqbzhsgQHl5edQY8x3gmDHm1fM59udSUVFR8ZfN8JX+Z/Qv5dYT/28C6tsAAAAASUVORK5CYII=";
  const windows11 =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAABmJLR0QA/wD/AP+gvaeTAAABCElEQVRYhe2WwUoDMRCGv2S3LfQmeqmlF4/Vm/psBR9A8N32JsWzSF0KRU+i2zUbD+tJUulkQCzMdwpD/pmPkEDAMIxfccnqYllBvBT2qmnaOaVv8cUDjpkwX3F3cf2zWKb3iuUAJoyGU1x4J4rlAK5SRZ/R6E8xQS0mqMUEtZigFhPUskuwzujVUnQbPsIL8CZOR55S5fRnwXXnwJlogC+fuZ2vAVhUU9zwWJQPcb2/oJZiPKb7PBJlSvdK4uTTgtEvgYloQOhabu5n3+tH8ANRvr9Wp/sJSuV6BgR/0i+jVG7nzIN9xf8GE9RiglpMUIsJajlYwSqjV02zXdFsV+T9J3NmGobxBQNuOlenTHdjAAAAAElFTkSuQmCC";
  const windows10 =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAABmJLR0QA/wD/AP+gvaeTAAABqElEQVRYhe3Yv2oUURSA8d/dDYYUBhZEAhbK7myT1crKzsbGxlhEbSx9BxsfwFoIPoCVNgZjQPAxtra3shAJ2ezOsciw7J9RF8fdjTAfDJeZuXPux5nD3OFQU7Ne0tpW/hBXhMxIhkzSFXIP09PJaRtLlTiKljNtDW2hLRUjN43sYDpFSX82RHXBw7jsQfruMO4JdyWZXCbJDG1LiGJu/C5QOYsJTmYi15Psoo2u8AmPhGfYF/5p4cwLvo/HuE1RG2SGtsaZWHHVlmXwBXqr1fg1jXUL/IlasCplgn/xMVge/2UGLxT1K67KhRcs20meCFsLR8h9AyPPNbysZJOczF6aF2zKDYpFF2HDj/E4rCB3zmA+/CwjbzXdWjhkeOf8b+aVpv1KevSZXvvC12AtWJVasCq1YFVqwaqU7cWvhTuSDjq4umKnKeYF99IBDsbnx7HpxDVNbUkPuxNtjOurF5zlfjrFl+L4PHXvODaFFkjeyH3V0BE6uIFLVQWX2yc4ipZB0SpJ2oyPLrZLnujbS1M/C+trv32MHacyzXGtZ3Kj2fZbTc26+QkUeVzllrl4UwAAAABJRU5ErkJggg==";
  const linux =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAMe0lEQVR4nO2dC1gU5RrHp6PMgHY5njqV2ckEdlFEZXZhZ1hUVELzEmZZZhnHTFHznlre8l4etbTQCG94VwI1y7tmOyuiHS/lBS90QJDUVK5qXhP + 5 / kGdgV2F1l2FnH5 / s / zPs / sss8zM + 9vvtv7ve / AMFRUVFRUVFRUVFRUVFRUVFRUVFROl69vyKPevPiKihemqDTiChUvxKt4YZFKI45WaQWBYZi / UQxVIB + t2EzNC8vUGuGWWiPClqk0YopaI3zgrdM9TsE4Qc + LoodKI8xRa8SC8kBYGC9eUWvE4QzDPELBKKTGgYFPqjXiEbtAWNrakJCQ2hSKAlLz4hYHYRSbEEWBOApDKwYrA0O2Ai9eH0ShOCCVRoxTEAhUvJhIgVRej6h4IUdJIDIUraijUCohdXNdI6VhFNsCCqQyQPyFjs4BIpyj0 + BKSOUf1NNeZ7fuGI63 + vSHtnVoub / z9tf50lZibwvRCgNNDmwSGIzBo8Zi0Kgx8rE1J8 / 9ZiEu5 + QhO + 8KMi9cRN8hH9oeR / zFCArETvlohGEmB8Zt + F52NLE1676zcHD / 4aPMfzfZhUtZCG7fxdZsayoFUskW8mbvfrKDD / 7yK1JS0 + TjNyL6lnJw0oHD8vf7DxzCD1u24lJ2rvx53sIl1lsJL86mQOwF4i++T5w3b2Esjh4 / AbVaDZ1OQMbv5xG1YLHZuX5Ca7mrWrfhO3h7e6NRo0YYMnSYDOSnvfustxCNOI4CsRcIL / QizkvYuBnLV66SHU1scexS + TuTc9t07iY7Pzy8q / k3np6eOJnyG5JTUm11WUMoEDul0gqdiPNiV8fh24T1ZmdPm / 4plqxca3ZuU7EVLuXkITg42PwbYolJ + 7E7MclGCxEiKRD7gQjEeR9NmobU9LPw9fWFl1cjGBKG4vi65kheVQ + Gb / 6JBRNfwLH9y9Avsp8Zhp + fHzLP / 1GqaytjkygQO + XFi97EeS2C2 + C3M + lI3BGNi1v + hRs7OaTHcYCRw + 3dHDLji45vJfpg3lhfiIFNsSbuW5y / dBn6sM42uiwhngKxU76i + A + TAz / 7uCUKjI / Jjk9bw + LqNlY + JvZzNIs7u4uOiRXu + TtuHmiLtVGh0OoDbXVZGRSI / fqbmhfufvHRiyiU7jm8InZhPStbesLjaKbTWV + ta / VeFIqd6hbePK / AUHEQOZtYLBnlhq8G10b + 1qJWpG8dYCum9QEFYqcie / mdP7KYxbHYe12UNbu + g8N3U90wJaIWDi2499tbPz0JH62N8Akv / kSB2KkWevHAyTX1sP9rNywf4yYP5gXF3RfpxsiAHj / JDZMjasH4pRvKtqbrKZPQqXtPWzOtQhLip1DskFojJgutApEtBSLrexZrxrvhk161MLV3LczoWxuLR7rh8CLWDMlkBUkNce3MwvLDJ0WtJJoCqaB89PrH1LxwkzjOkLQPN5Pfv + 8YUpD0Av5M / Ro5OZfNQUYyZbYVIVbx4h3aSioob154z + S4A78eRXZePm6cGgUY3S1AFCY + hRunxiEn57xF1JdY74HDbO + P8MIy2kruI19fX1bNi2kmp6WknTE7N//cTlxPmYIbJ0fgZvJA/JkWhZzsDKsgTBZfIvZlBchdtX9QIIVSjtQacbrJYZpWocjKzS/X4fezPy5nQ9euQ3m7iCcahoS4UyhWYejaqXjhL5OzyM6fIzBMNmXWnPKAkNX7TAqk7Lih1XupeDG7pKPWrr+3W+iIHUk+BR9tUPldl1ZoSaEUq75WW4dMc0s6SQztJHc3SgAh9k6/gfdpJWK6p1b7BIXCkK5KiCrroJlfzlcMxn0H93tQEmo8EB+trm3ZUoOisHv5syd77WJWDsTQjveFQnYra3Q1lEojppd1yqyoaEVhmGz67Ln3B6IRLpPwP1MTpeKFyWUdQtJ3zv1xySlATvyWiqZCK/k85Q7yGiGGqWlqrNXWV2mEayUdQZz0w/adToFhslGfTJHP9VLX7mgX/rotKAU1LjGbJD6bHNA4QC+PIaMnTnUqDGLHTp42x7def7cPhnw03tYAf7DG5AGToJ5pAegntk5pEqBH2y7d8PsF53RVZY2kpZocP2LsRJtji0ojdmNqgkgfXXzDt/sOGSnHrRK+31IlMIgZ9u4v5fiNW7YjcthIazOuw4yry4fXP2cqbQ4K7by+Z58BhR269XA4ZmWPkXO16fyq2fFhXd9AanqmHDuzaCV8UGvGlaXSiF8U32zhxm3bE311LTF/0dIqg2GywaPHlXI8Sayb+NksazOuNYyL15znkhvVtglLit+4qZBMQ8nTWdVAyu4mfj4/Boakn60BueWyLyHw0YjvmG509vxv1pEnst/QkVUOg9j23cZSjiczPFJbYmN98ibjiiLZHkX9sngnNSMzrsd7kYhdFfdAgKRmZJZy+sgJk+XvmweFWJttrWBcTU34oIZytkfRTZ7MystPJGVoR5JPPRAgZGAvud/+n7nz5O/JmGY5sAunGVcTyTov8cRtzcq7kkmAZFXh7Kqs6dre20nctGMX0s7+bnPlTuJujCuJhLbNIZIA/aas3Py7/UeMfmAwiLV75TX5ekgUmOy92CphkB+igABPxlVfBOCvb2sgDtmwedsDBRLeM0K+nmmz5sqf50QvtAmkcUCQH+Mq8mwe9HTJm/PVBec9yK4qu9hIDSNJgDiTeU7+/G7kINstpIXYgHEVkZshWYi93vQzlwk86NaRnXcFXd+OwJr1G+Vjkm5kK6lOzYv5jCvprsGt553d7n+RxLbszXXR47VmcpjCVEGb/YAsOna5+Xj2vGjbrUMj/Mi4irCH7Q6JKyyZbXh1Rx10f7UZAkLCqhRKTu5FXEuPxdWM1XLK6am0DMSsTsDkudEIj4iEtl0nNLW2DuGFCYwrCImcJ4xcvrVc3KwtdRHcJkBuKWTVXBVAbv/SxXz+m/8NwluDPkTY230trGV4j7s+Wj3ahWkwdajXnR1Rzz78++wwMO6QuMPlJUj/vORJNNEK8mJseVyCU2HkXj5tkRu8dn4bq0Dav/P+3cMrG5w1t2yJu41E9xeYh1XYwdSFkd1WkcqnGR96mruGGXOinLZQvJK5wfKBWOFpFcjaL7WW1yqxD1f1LvYyj8HItYfETYPEnq1oKdqNXR4IDdOYoZBs9YxzFxQHcvXsWotz71vhbQFj0rgOuGvwsHatW5iHQTCynWFk98HIybOoytjeRU+VKj8L7dodh44eVxZI+krLmhLJXW4NYz/uhAljO2LnoiblFJmy1b96F1sZDhJ3o7IgStqYAepSMxttyEvYJSUqBuRaxjLHrlEeT+rUZ6qzEM/UsjWLstfyt9UFWTyWhEJenVHy9UwOAUmPdfgaYeQ+Z6q7IHGblQACI4d1s56zWAOQN/6QvQtHgfyZOt/xayyadfVnqrNg4IYoBaRQ4uRVfFkoJArrKBBSeaXUdcLIxsJQ51mmOgpS7UDlbpQDKYVuEiCYYZA9k3MX7xVyVtbyDvdVEIjcWq7CyE4AqlkyHX6s+4yiN2rkMGtUI/llljFLVyoyBV4Vvx4nEtTKAjGZgWvDVCdhF/OE0jd580cPtH+Zx5SZX5hfblkZO3riNPoMHiG3tLyd9Z0DRKpdvYpGIblHOONGj6yoB99AQX7168Ejx+wGMWH6THmWRmCQl9BAci9UuMsqgJGbzFQnYR/jASN7zilPnpHD/PEvFu/W6eUCUJJuaqsLO516Biu+XYc+g4bLvy85KejSuYXS13YcBg+RqW6CxIY7CwbIC2R2e1i80Yc4m6zkye7egBGj8e8BQ+XPtvYyiA15z6dAoVZxHRI7DskMy1RHwciOdiYQGDmM/0BVrrMrYl+NaXhNARjrqn3EF0aug7OBxHzS0GEgqz9tkFv5a2D/B4kLYx4WQeIiIbGXnQUkeoKdQHjxupoXbpT8bsX0Bjcr0SIKIbExZCuBediEQ0wdSOxrMLILILFpSgKRYp6KISUBal5oTnKjylojQXimWbOW9cg7Ukpek7f3y5xcNucvvrT1q6ftDO+wF0kUm3EVkbACjGxXSNwMSKwk77hVGoq7w/UZ2MOF2nHOgzB4PM+4smBgHoXEdoPELi0KOVT4SU0FHP9HkXJUWuJSKtBNJZCpPFOTJMMxcr0hscay2Sgo7ZyrMLrrFTuvxDaRB2jr58uHkR2uBPyHWtjNeUFix0Nid8gTA4nLLXIauxB7WLXi5zMwtSFxbeUItcR+DIkdBontRBIylD4XFRUVFRUVFRUVFRUVFRUVFRUV44L6P5k0yd/06ophAAAAAElFTkSuQmCC";

  invoke<boolean>("is_development").then((value) => (development = value));

  invoke<string>("get_windows")
    .then((version) => {
      window.os = {
        type: "windows",
        version: "10",
      };
      name = version;
      if (version === "10") {
        window.os.version = "10";
        windowsVersion = windows10;
      } else if (version == "11") {
        window.os.version = "11";
        windowsVersion = windows11;
      } else {
        window.os.version = "lin";
        window.os.type = "linux";
        windowsVersion = linux;
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
