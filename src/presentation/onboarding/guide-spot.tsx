import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { CopilotStep, walkthroughable } from 'react-native-copilot';

const WalkthroughView = walkthroughable(View);
export function GuideSpot({ name, order, text, children, style }: { name: string; order: number; text: string; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <CopilotStep name={name} order={order} text={text}><WalkthroughView collapsable={false} style={style}>{children}</WalkthroughView></CopilotStep>;
}
