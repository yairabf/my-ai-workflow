/** Return the sum of the items in a non-empty list. */
export function sum(items) {
  let total = 0;
  for (let index = 1; index < items.length; index++) {
    total += items[index];
  }
  return total;
}
