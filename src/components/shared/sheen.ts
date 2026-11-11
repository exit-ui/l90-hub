/** Moves the sheen light of the active tab pill to the pointer. */
export function placeSheen(element: HTMLElement, clientX: number, clientY: number) {
  const box = element.getBoundingClientRect();
  element.style.setProperty('--mx', `${clientX - box.left}px`);
  element.style.setProperty('--my', `${clientY - box.top}px`);
}
