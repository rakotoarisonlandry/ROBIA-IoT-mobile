import { useMemo } from 'react';
import QRCode from 'qrcode';
import Svg, { Rect } from 'react-native-svg';
export function QR({ value, size = 126 }: { value: string; size?: number }) {
  const qr = useMemo(
    () => QRCode.create(value, { errorCorrectionLevel: "M" }),
    [value],
  );
  return (
    <Svg
      width={size}
      height={size}
      viewBox={`-2 -2 ${qr.modules.size + 4} ${qr.modules.size + 4}`}
    >
      <Rect
        x={-2}
        y={-2}
        width={qr.modules.size + 4}
        height={qr.modules.size + 4}
        fill="white"
      />
      {Array.from(qr.modules.data).map((v, i) =>
        v ? (
          <Rect
            key={i}
            x={i % qr.modules.size}
            y={Math.floor(i / qr.modules.size)}
            width={1}
            height={1}
            fill="#151515"
          />
        ) : null,
      )}
    </Svg>
  );
}
