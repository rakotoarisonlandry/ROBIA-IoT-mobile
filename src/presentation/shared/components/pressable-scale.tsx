import { useState } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const spring = { damping: 18, stiffness: 320, mass: 0.6 };

type Props = Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle>; pressedStyle?: StyleProp<ViewStyle>; scaleTo?: number };

/** Pressable that gently sinks under the finger. */
export function PressableScale({ style, pressedStyle, scaleTo = 0.97, onPressIn, onPressOut, disabled, children, ...props }: Props) {
  const scale = useSharedValue(1);
  const [pressed, setPressed] = useState(false);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      onPressIn={event => {
        if (!disabled) { scale.set(withSpring(scaleTo, spring)); setPressed(true); }
        onPressIn?.(event);
      }}
      onPressOut={event => {
        scale.set(withSpring(1, spring)); setPressed(false);
        onPressOut?.(event);
      }}
      style={[style, pressed && pressedStyle, animated]}
    >
      {children}
    </AnimatedPressable>
  );
}
