import { createContext, useContext } from 'react';

/** True once the view has finished growing out of its card. The heavy parts of a view wait for it. */
export const SheetLandedContext = createContext(true);

/** Reads whether the view around this component has landed. Outside a view it is always true. */
export function useSheetLanded(): boolean {
  return useContext(SheetLandedContext);
}
