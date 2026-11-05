import { createContext, useContext, useImperativeHandle, useRef, type ComponentRef, type ReactNode, type RefObject } from 'react';
import { Platform, ScrollView, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { CopilotStep } from 'react-native-copilot';

export type GuideScrollHandle = ComponentRef<typeof ScrollView>;
const ScrollContext = createContext<RefObject<GuideScrollHandle | null> | null>(null);
export function GuideViewport({ scrollRef, children }: { scrollRef: RefObject<GuideScrollHandle | null>; children: ReactNode }) {
  return <ScrollContext.Provider value={scrollRef}>{children}</ScrollContext.Provider>;
}
type MeasureCallback = (x: number, y: number, width: number, height: number, pageX: number, pageY: number) => void;
type Measurable = { measure(callback: MeasureCallback): void };
type TargetProps = ViewProps & { copilot?: { ref: RefObject<Measurable | null>; onLayout?: ViewProps['onLayout'] } };

/** Copilot adapter for RN 0.88 host refs and RN Web (no legacy findNodeHandle). */
function GuideTarget({ copilot, ...props }: TargetProps) {
  const target = useRef<ComponentRef<typeof View>>(null);
  const scrollRef = useContext(ScrollContext);
  useImperativeHandle(copilot?.ref, () => ({
    measure(callback) {
      const node = target.current;
      if (!node) { callback(0, 0, 0, 0, 0, 0); return; }
      const measure = () => requestAnimationFrame(() => requestAnimationFrame(() => node.measure(callback)));
      if (Platform.OS === 'web') {
        (node as unknown as HTMLElement).scrollIntoView?.({ block: 'center', inline: 'nearest', behavior: 'auto' });
        measure(); return;
      }
      const scroll = scrollRef?.current;
      const content = scroll?.getInnerViewRef();
      if (!scroll || !content) { measure(); return; }
      node.measureLayout(content, (_x, y) => {
        scroll.scrollTo({ y: Math.max(0, y - 100), animated: false });
        measure();
      }, measure);
    },
  }), [scrollRef]);
  return <View {...props} ref={target} collapsable={false} onLayout={copilot?.onLayout} />;
}

export function GuideSpot({ name, order, text, children, style }: { name: string; order: number; text: string; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <CopilotStep name={name} order={order} text={text}><GuideTarget style={style}>{children}</GuideTarget></CopilotStep>;
}
