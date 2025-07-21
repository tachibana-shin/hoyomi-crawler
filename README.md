# @hoyomi/bridge

A lightweight, composable conversion toolkit for extracting structured and type-safe data from raw HTML documents.

## Features

* 🧩 Functional, composable converter types
* 🔠 Built-in primitives: `string`, `boolean`, `int`, `float`, `buffer`
* 🧪 Regex-based and slug-based extractors
* 📅 Custom date formatting with templates like `DD/MM/YYYY hh:mm`
* 🌐 Fetch support with `query` injection and extended `RequestInit`
* 🔒 Fully type-safe, written in TypeScript

## Installation

```bash
bun add @hoyomi/bridge
# or
yarn add @hoyomi/bridge
# or
npm install @hoyomi/bridge
```

## Usage

```ts
import { Crawler, types } from "@hoyomi/bridge"

const crawler = await Crawler.load("https://example.com")

const title = crawler.get("title", types.str())
const views = crawler.get(".view-count", types.int())
const slug = crawler.get("a.link", types.slug(1))
const createdAt = crawler.get("time", types.customDate("DD-MM-YYYY hh:mm"), ":time")
```

## API Reference

### `Crawler.load(input, init?)`

```ts
Crawler.load(
  input: string | URL | Request,
  init?: RequestInit & {
    query?: Record<string, string | string[]>
  }
): Promise<Crawler>
```

Loads a webpage using `fetch()` and initializes a Cheerio-bound `Crawler` instance. Automatically parses HTML responses.

* `query`: Optional query parameters to append to the URL.

### `crawler.get(selector, type)`

```ts
crawler.get<T>(
  selector: string | (($: CheerioAPI) => Cheerio<Element>),
  type: Converter<T>
): T
```

Queries and transforms a single DOM element into the desired type.

---

## Built-in Converters (`types.*`)

### Primitive Converters

```ts
types.str(): Converter<string>
types.bool(): Converter<boolean>
types.int(): Converter<number>
types.float(): Converter<number>
types.buffer(): Converter<ArrayBuffer>
```

### Advanced Converters

```ts
types.regexp<T>(pattern: string | RegExp, convert: Converter<T>): Converter<T>
types.slug(start: number, end?: number): Converter<string>
types.customDate(template: string): Converter<Date>
```

#### `customDate`

Converts a formatted date string to a JavaScript `Date`. Supports flexible templates using:

* `YYYY`, `MM`, `DD`
* `hh`, `mm`, `ss`

```ts
// Example
const date = crawler.get(".date", types.customDate("DD/MM/YYYY hh:mm:ss"))
```

---

## Testing

```bash
bun test
```

---

## Related

* [`chrono-node`](https://github.com/wanasit/chrono) — Natural language date parser (not built-in, but compatible)
* [`cheerio`](https://cheerio.js.org) — jQuery-like server-side HTML parser

---

## License

MIT © 2025-present Tachibana Shin
