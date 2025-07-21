import { createConverter } from "../crawler"

const tokenRegex = /(YYYY|MM|DD|hh|mm|ss)/g

export const customDate = (template: string) =>
  createConverter<Date>((input: string) => {
    const pattern = template.replace(tokenRegex, "(\\d+)")
    const matcher = new RegExp(`^${pattern}$`)
    const match = input.match(matcher)

    if (!match) {
      throw new Error(`Input "${input}" does not match template "${template}"`)
    }

    const tokens = [...template.matchAll(tokenRegex)].map((m) => m[0])
    const values = match.slice(1).map(Number)

    const map = Object.fromEntries(tokens.map((t, i) => [t, values[i]]))

    const year = map["YYYY"] ?? 1970
    const month = (map["MM"] ?? 1) - 1
    const day = map["DD"] ?? 1
    const hour = map["hh"] ?? 0
    const minute = map["mm"] ?? 0
    const second = map["ss"] ?? 0

    return new Date(year, month, day, hour, minute, second)
  }, "text")
