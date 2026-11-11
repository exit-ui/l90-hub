/**
 * Gives the data of the store without the actions.
 * A backup holds data only. It does not hold functions.
 */
export function dataOnly<T extends { actions: unknown }>(store: T): Omit<T, 'actions'> {
  const data: Partial<T> = { ...store };
  delete data.actions;
  return data as Omit<T, 'actions'>;
}
