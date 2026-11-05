import Svg, { Path } from 'react-native-svg';
const icons: Record<string, string> = {
  home: "M3 10 12 3l9 7v11h-6v-7H9v7H3Z",
  calendar: "M4 5h16v16H4ZM8 2v6m8-6v6M4 11h16",
  shop: "M3 10h18l-2-7H5ZM4 10v11h16V10M9 21v-7h6v7",
  ticket: "M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4Zm12 0v3m0 2v2m0 2v3",
  user: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 22v-3a8 8 0 0 1 16 0v3",
  pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  clock: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM12 6v6l4 2",
  money: "M3 5h18v14H3ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0M6 9v6m12-6v6",
  phone: "M6 2h12v20H6ZM10 18h4",
  wifi: "M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0m-11 4a6 6 0 0 1 8 0m-4 4h0",
  bag: "M4 7h16l1 15H3ZM8 8V6a4 4 0 0 1 8 0v2",
  help: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM9 8a3 3 0 1 1 4 3c-1 1-1 2-1 3m0 3h0",
  bell: "M5 17h14l-2-4V8A5 5 0 0 0 7 8v5Zm5 4h4",
  check: "m5 12 4 4L20 5",
  download: "M12 2v13m-5-5 5 5 5-5M4 17v5h16v-5",
  close: "m6 6 12 12M6 18 18 6",
  spark: "m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z",
  search: "M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-2 6 6 6",
};
export function Icon({
  name,
  size = 22,
  color = "#222",
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d={icons[name] || icons.spark} />
    </Svg>
  );
}
