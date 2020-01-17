// Make a map and return a function for checking if a key
// 制作一个map并返回一个函数来检查
// is in that map.
// 在map里
//
// IMPORTANT: all calls of this function must be prefixed with /*#__PURE__*/
// 重要：此函数的所有调用都必须以前缀
// So that rollup can tree-shake them if necessary.
// 以便Rollup可以在必要时对它们进行tree-shake。
export function makeMap(
  str: string,
  expectsLowerCase?: boolean
): (key: string) => boolean {
  const map: Record<string, boolean> = Object.create(null)
  const list: Array<string> = str.split(',')
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true
  }
  return expectsLowerCase ? val => !!map[val.toLowerCase()] : val => !!map[val]
}
