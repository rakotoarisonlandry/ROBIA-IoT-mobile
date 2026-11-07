import { createContext, useCallback, useContext, useEffect, useImperativeHandle, useRef, type ComponentRef, type ReactNode, type RefObject } from 'react';
import { Platform, ScrollView, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { CopilotStep } from 'react-native-copilot';
import { useGuideRuntime } from './guide-runtime';

export type GuideScrollHandle = ComponentRef<typeof ScrollView>;
const ScrollContext = createContext<RefObject<GuideScrollHandle | null> | null>(null);
export function GuideViewport({ scrollRef, children }: { scrollRef: RefObject<GuideScrollHandle | null>; children: ReactNode }) {
  return <ScrollContext.Provider value={scrollRef}>{children}</ScrollContext.Provider>;
}

type MeasureCallback = (x: number, y: number, width: number, height: number, pageX: number, pageY: number) => void;
type Measurable = { measure(callback: MeasureCallback): void };
type TargetProps = ViewProps & { name: string; copilot?: { ref: RefObject<Measurable | null>; onLayout?: ViewProps['onLayout'] } };

/** Wait for real host layout; measure inside the correct page or dialog scroll view. */
function GuideTarget({ name, copilot, ...props }: TargetProps) {
  const target = useRef<ComponentRef<typeof View>>(null);
  const layout = useRef({ width: 0, height: 0 });
  const scrollRef = useContext(ScrollContext);
  const { targets } = useGuideRuntime();
  const measure = useCallback((callback: MeasureCallback) => {
    const node = target.current;
    if (!node) { callback(0, 0, 0, 0, 0, 0); return; }
    const finish = () => requestAnimationFrame(() => requestAnimationFrame(() => node.measure(callback)));
    if (Platform.OS === 'web') {
      (node as unknown as HTMLElement).scrollIntoView?.({ block: 'center', inline: 'nearest', behavior: 'auto' });
      finish(); return;
    }
    const scroll = scrollRef?.current;
    const content = scroll?.getInnerViewRef();
    if (!scroll || !content) { finish(); return; }
    node.measureLayout(content, (_x, y) => {
      scroll.scrollTo({ y: Math.max(0, y - 130), animated: false });
      finish();
    }, finish);
  }, [scrollRef]);
  useImperativeHandle(copilot?.ref, () => ({ measure }), [measure]);
  useEffect(() => {
    const handle = {
      ready: () => !!target.current && layout.current.width > 0 && layout.current.height > 0,
      measure: () => new Promise<{ width: number; height: number }>(resolve => measure((_x, _y, width, height) => resolve({ width, height }))),
    };
    targets.set(name, handle);
    return () => { if (targets.get(name) === handle) targets.delete(name); };
  }, [measure, name, targets]);
  return <View {...props} ref={target} collapsable={false} onLayout={event => {
    layout.current = event.nativeEvent.layout;
    copilot?.onLayout?.(event);
  }} />;
}

export function GuideSpot({ name, order, text, children, style }: { name: string; order: number; text: string; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <CopilotStep name={name} order={order} text={text}><GuideTarget name={name} style={style}>{children}</GuideTarget></CopilotStep>;
}
