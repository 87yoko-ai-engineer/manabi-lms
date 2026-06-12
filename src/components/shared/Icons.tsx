// ============================================================
// Manabi LMS — SVGアイコン (stroke 1.6, 24x24)
// フック不使用の純粋描画のため Server/Client 両方から利用可能
// ============================================================
import React from "react";

interface IcProps {
  d: string | string[];
  fill?: boolean;
  size?: number;
  sw?: number;
  style?: React.CSSProperties;
}

function Ic({ d, fill, size = 22, sw = 1.6, style }: IcProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? "currentColor" : "none"}
      stroke={fill ? "none" : "currentColor"} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
      {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
    </svg>
  );
}

export type IconProps = Omit<IcProps, "d">;
export type IconComponent = (p?: IconProps) => React.JSX.Element;

export const Icons = {
  home: (p?: IconProps) => <Ic {...p} d={["M3 11.5 12 4l9 7.5", "M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9", "M9.5 20v-6h5v6"]} />,
  book: (p?: IconProps) => <Ic {...p} d={["M4 5.5A1.5 1.5 0 0 1 5.5 4H18a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H6a2 2 0 0 0-2 2z", "M4 18.5A1.5 1.5 0 0 1 5.5 17H19"]} />,
  bell: (p?: IconProps) => <Ic {...p} d={["M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8", "M13.7 20a1.94 1.94 0 0 1-3.4 0"]} />,
  search: (p?: IconProps) => <Ic {...p} d={["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z", "M21 21l-4.3-4.3"]} />,
  check: (p?: IconProps) => <Ic {...p} d="M20 6 9 17l-5-5" />,
  checkCircle: (p?: IconProps) => <Ic {...p} d={["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "m8.5 12 2.5 2.5L16 9"]} />,
  circle: (p?: IconProps) => <Ic {...p} d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />,
  play: (p?: IconProps) => <Ic {...p} d="M8 5.5v13l11-6.5z" fill />,
  playC: (p?: IconProps) => <Ic {...p} d={["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M10 9l5 3-5 3z"]} />,
  clock: (p?: IconProps) => <Ic {...p} d={["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M12 7.5V12l3 2"]} />,
  chevDown: (p?: IconProps) => <Ic {...p} d="M6 9l6 6 6-6" />,
  chevRight: (p?: IconProps) => <Ic {...p} d="M9 6l6 6-6 6" />,
  chevLeft: (p?: IconProps) => <Ic {...p} d="M15 6l-6 6 6 6" />,
  arrowRight: (p?: IconProps) => <Ic {...p} d={["M5 12h14", "M13 6l6 6-6 6"]} />,
  grid: (p?: IconProps) => <Ic {...p} d={["M4 4h7v7H4z", "M13 4h7v7h-7z", "M4 13h7v7H4z", "M13 13h7v7h-7z"]} />,
  users: (p?: IconProps) => <Ic {...p} d={["M16 19v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M9 9a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z", "M22 19v-2a4 4 0 0 0-3-3.87", "M16 2.13A4 4 0 0 1 16 9.87"]} />,
  chart: (p?: IconProps) => <Ic {...p} d={["M3 3v18h18", "M7 15l3.5-4 3 2.5L19 7"]} />,
  layers: (p?: IconProps) => <Ic {...p} d={["M12 3 3 8l9 5 9-5z", "M3 13l9 5 9-5", "M3 18l9 5 9-5"]} />,
  logout: (p?: IconProps) => <Ic {...p} d={["M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3", "M10 17l-5-5 5-5", "M5 12h12"]} />,
  lock: (p?: IconProps) => <Ic {...p} d={["M5 11h14v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z", "M8 11V7a4 4 0 0 1 8 0v4"]} />,
  mail: (p?: IconProps) => <Ic {...p} d={["M3 6h18v12H3z", "m3 7 9 6 9-6"]} />,
  plus: (p?: IconProps) => <Ic {...p} d={["M12 5v14", "M5 12h14"]} />,
  filter: (p?: IconProps) => <Ic {...p} d="M3 5h18l-7 8v5l-4 2v-7z" />,
  x: (p?: IconProps) => <Ic {...p} d={["M6 6l12 12", "M18 6 6 18"]} />,
  menu: (p?: IconProps) => <Ic {...p} d={["M4 6h16", "M4 12h16", "M4 18h16"]} />,
  sparkle: (p?: IconProps) => <Ic {...p} d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" fill />,
  award: (p?: IconProps) => <Ic {...p} d={["M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z", "M8.5 13.5 7 22l5-3 5 3-1.5-8.5"]} />,
};
