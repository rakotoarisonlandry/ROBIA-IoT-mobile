import Svg, { Circle, Path } from 'react-native-svg';
export function LocationIcon({
  color = "#ff6600",
  size = 22,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.7}
    >
      <Circle cx={12} cy={12} r={7} />
      <Circle cx={12} cy={12} r={2} />
      <Path d="M12 1v4m0 14v4M1 12h4m14 0h4" />
    </Svg>
  );
}
