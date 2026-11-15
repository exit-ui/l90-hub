import { useEffect, useRef, useState } from 'react';

/** A count that goes up one time each time the number goes up. Use it as a key to replay a bump. */
export function useIncrease(value: number): number {
  const previous = useRef(value);
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (value > previous.current) {
      setCount((current) => current + 1);
    }
    previous.current = value;
  }, [value]);
  return count;
}
