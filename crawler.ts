// biome-ignore assist/source/organizeImports: <false>
import { load, type Cheerio, type CheerioAPI } from "cheerio"
import type { Element } from "domhandler"

export type Method =
  | "text"
  | "html"
  | `attr-${string}`
  | `data-${string}`
  | `:${string}` /* attr alias */
  | `.${string}` /* data alias */
export type Converter<T> = {
  convert: (input: string) => T
  method?: Method
}

export function createConverter<T>(
  fn: (input: string) => T,
  method: Method = "text"
): Converter<T> {
  return {
    convert: fn,
    method
  }
}

export const types = {
  str: createConverter((input: string) => input, "text"),

  bool: createConverter(
    (input: string) =>
      !!input &&
      input !== "false" &&
      input !== "0" &&
      input.toLowerCase() !== "null" &&
      input.toLowerCase() !== "undefined"
  ),

  int: createConverter((input: string) => parseInt(input, 10)),

  float: createConverter((input: string) => parseFloat(input)),

  buffer: createConverter((input: string) => new TextEncoder().encode(input)),

  json: createConverter((input: string) => JSON.parse(input)),

  date: createConverter((input: string) => new Date(input)),

  "str?": createConverter((input: string) => input || undefined, "text"),

  "bool?": createConverter((input: string) =>
    input === ""
      ? undefined
      : !!input &&
        input !== "false" &&
        input !== "0" &&
        input.toLowerCase() !== "null" &&
        input.toLowerCase() !== "undefined"
  ),

  "int?": createConverter((input: string) =>
    input ? parseInt(input, 10) : undefined
  ),

  "float?": createConverter((input: string) =>
    input ? parseFloat(input) : undefined
  ),

  "buffer?": createConverter((input: string) =>
    input ? new TextEncoder().encode(input) : undefined
  ),

  "json?": createConverter((input: string) =>
    input ? JSON.parse(input) : undefined
  ),

  "date?": createConverter((input: string) =>
    input ? new Date(input) : undefined
  ),

  regexp: <T>(pattern: string | RegExp, convert: Converter<T>) =>
    createConverter<T>((input: string) => {
      const regex = typeof pattern === "string" ? new RegExp(pattern) : pattern
      const match = input.match(regex)
      if (!match) throw new Error(`No match found for pattern: ${pattern}`)

      return convert.convert(match[1] ?? match[0])
    }),

  slug: (start: number, end?: number) =>
    createConverter((input: string) => {
      return input
        .split("/")
        .filter(Boolean)
        .slice(start, end === undefined ? undefined : end + 1)
        .join("/")
    }, ":href"),

  custom: createConverter
} as const
export function type(name: keyof typeof types) {
  return types[name]
}

export class Crawler {
  static readonly types = types
  static readonly type = type
  static fetch: typeof fetch = fetch

  static async load(
    input: string | URL | Request,
    init?: RequestInit & { query?: Record<string, string | string[]> }
  ): Promise<Crawler> {
    if ((typeof input === "string" || input instanceof URL) && init?.query) {
      const url = new URL(input.toString())

      for (const [key, value] of Object.entries(init.query)) {
        if (Array.isArray(value)) {
          value.forEach((v) => url.searchParams.append(key, v))
        } else {
          url.searchParams.append(key, value)
        }
      }

      input = url.toString()
    }

    const data = await Crawler.fetch(input, init).then(async (res) =>
      res.ok
        ? res.text()
        : Promise.reject(
            Object.assign(new Error(`Failed to fetch ${input} (${res.text})`), {
              response: res
            })
          )
    )

    return new Crawler(load(data))
  }

  constructor(public $: CheerioAPI) {}

  get<T = string>(
    selector: string | Element | Cheerio<Element> | (($: CheerioAPI) => Cheerio<Element>),
    {
      convert,
      method: converterMethod
    }: Converter<T> = types.str as Converter<T>,
    method: Method = converterMethod ?? "text"
  ): T {
    const element =
      typeof selector === "function" ? selector(this.$) : this.$(selector)
    if (element.length === 0) {
      throw new Error(`Element not found for selector: ${selector}`)
    }

    if (method.startsWith(":")) method = `attr-${method.slice(1)}`
    else if (method.startsWith(".")) method = `data-${method.slice(1)}`

    const [fnName, ...param] = method.split("-") as [
      "text" | "html" | "attr" | "data",
      string?
    ]
    let text = ""
    switch (fnName) {
      case "text":
        text = element.text()
        break
      case "html":
        text = element.html() ?? ""
        break
      case "attr":
        text = element.attr(param.join("-"))?.toString() ?? ""
        break
      case "data":
        text = (element.data(param.join("-")) as string)?.toString() ?? ""
        break
    }

    return convert(text)
  }
}
