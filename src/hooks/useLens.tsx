import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { type Brand, isChromium, lensPixels } from '@/lib/glass';

interface UserAgentData {
  brands?: readonly Brand[];
}

function lensSupported(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }
  const data: unknown = Reflect.get(navigator, 'userAgentData');
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  return isChromium((data as UserAgentData).brands);
}

function mapUrl(width: number, height: number, radius: number, bezel: number): string | null {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    return null;
  }
  const pixels = lensPixels({ width, height, radius, bezel });
  context.putImageData(new ImageData(pixels, width, height), 0, 0);
  return canvas.toDataURL();
}

interface LensOptions {
  /** The corner radius of the element in px. Use a large value for a capsule. */
  radius: number;
  /** The width of the bent rim in px. */
  bezel?: number;
  /** How far the rim moves the backdrop, in px. */
  strength?: number;
}

interface Lens<T extends HTMLElement> {
  ref: RefObject<T | null>;
  /** Render this inside the element. It is empty when the browser cannot show the lens. */
  filter: ReactNode;
  /** Sets the --lens variable that the glass utility adds to its backdrop-filter. */
  style: CSSProperties;
}

/**
 * Edge lensing for a liquid glass element.
 * Chromium bends the backdrop at the rim with an SVG displacement map.
 * Safari and Firefox keep the plain blur.
 */
export function useLens<T extends HTMLElement>({
  radius,
  bezel = 18,
  strength = 40,
}: LensOptions): Lens<T> {
  const ref = useRef<T>(null);
  const rawId = useId();
  const id = `lens-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const [supported] = useState(lensSupported);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!supported || !element) {
      return;
    }
    const observer = new ResizeObserver(() => {
      const width = Math.round(element.offsetWidth);
      const height = Math.round(element.offsetHeight);
      setSize((current) =>
        current && current.width === width && current.height === height
          ? current
          : { width, height },
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [supported]);

  const url = useMemo(() => {
    if (!size || size.width < 2 || size.height < 2) {
      return null;
    }
    return mapUrl(size.width, size.height, radius, bezel);
  }, [size, radius, bezel]);

  if (!supported || !size || !url) {
    return { ref, filter: null, style: {} };
  }

  const style: CSSProperties & Record<'--lens', string> = { '--lens': `url(#${id})` };
  const filter = (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute size-0 overflow-hidden"
      focusable="false"
    >
      <filter
        colorInterpolationFilters="sRGB"
        filterUnits="userSpaceOnUse"
        height={size.height}
        id={id}
        primitiveUnits="userSpaceOnUse"
        width={size.width}
        x="0"
        y="0"
      >
        <feImage
          height={size.height}
          href={url}
          preserveAspectRatio="none"
          result="map"
          width={size.width}
          x="0"
          y="0"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="map"
          scale={strength}
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
  return { ref, filter, style };
}
