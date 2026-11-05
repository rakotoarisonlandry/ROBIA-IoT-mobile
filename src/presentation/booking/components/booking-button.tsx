import { Pressable, Text } from 'react-native';
import { Icon } from './booking-icon';
import { bookingStyles as s } from '../screens/booking-screen.styles';
export function Button({
  label,
  onPress,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        pressed && { opacity: 0.75 },
      ]}
    >
      <Text style={[s.buttonText, secondary && { color: "#222" }]}>
        {label}
      </Text>
      <Icon
        name={secondary ? "download" : "arrow"}
        size={18}
        color={secondary ? "#222" : "white"}
      />
    </Pressable>
  );
}
