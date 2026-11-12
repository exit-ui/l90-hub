import { useEffect, useRef, useState } from 'react';

/** A count that goes up one time each time the value turns from false to true. */
export function useRisingEdge(value: boolean): number {
  const previous = useRef(value);
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (value && !previous.current) {
      setCount((current) => current + 1);
    }
    previous.current = value;
  }, [value]);
  return count;
}
