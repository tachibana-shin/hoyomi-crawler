// biome-ignore assist/source/organizeImports: <false>
import { describe, it, expect } from "bun:test"
import { Crawler } from "./crawler"
import { load } from "cheerio"
import { dayjsConverter } from "./converters/dayjs"

const html = `
  <div id="root">
    <p class="title" data-id="123">Hello World</p>
    <span class="value" data-flag="true">42</span>
    <time class="date" datetime="2025-07-21T10:00:00Z">July 21, 2025</time>
  </div>
`

describe("Crawler basic behavior", () => {
  const crawler = new Crawler(load(html))

  it("gets text content", () => {
    const text = crawler.get(".title")
    expect(text).toBe("Hello World")
  })

  it("gets html content", () => {
    const html = crawler.get(".title", undefined, "html")
    expect(html).toBe("Hello World")
  })

  it("gets attribute value", () => {
    const attr = crawler.get(".title", undefined, "attr-data-id")
    expect(attr).toBe("123")
  })

  it("gets data attribute using 'data-*'", () => {
    const data = crawler.get(".value", undefined, "data-flag")
    expect(data).toBe("true")
  })

  it("gets attribute using alias ':'", () => {
    const aliasAttr = crawler.get(".title", undefined, ":data-id")
    expect(aliasAttr).toBe("123")
  })

  it("gets data using alias '.'", () => {
    const aliasData = crawler.get(".value", undefined, ".flag")
    expect(aliasData).toBe("true")
  })
})

describe("Crawler with typed converters", () => {
  const crawler = new Crawler(load(html))

  it("converts to int", () => {
    const result = crawler.get(".value", Crawler.types.int)
    expect(result).toBe(42)
  })

  it("converts to bool", () => {
    const result = crawler.get(".value", Crawler.types.bool, "data-flag")
    expect(result).toBe(true)
  })

  it("converts to Date", () => {
    const result = crawler.get(".date", Crawler.types.date, "attr-datetime")
    expect(result instanceof Date).toBe(true)
    expect(result.toISOString()).toBe("2025-07-21T10:00:00.000Z")
  })

  it("converts using dayjs with format", () => {
    const c = new Crawler(
      load(`<span class="custom-date">2025-07-21T17:08:46.362Z</span>`)
    )
    const result = c.get(".custom-date", dayjsConverter("hh:mm:ss DD/MM/YYYY"))
    expect(result.format("YYYY-MM-DD")).toBe("2025-07-21")
  })
})

describe("Crawler.load()", () => {
  it("loads HTML from inline data URL", async () => {
    const mockUrl = `data:text/html,${encodeURIComponent(html)}`
    const crawler = await Crawler.load(mockUrl)
    const text = crawler.get(".title")
    expect(text).toBe("Hello World")
  })
})

describe("Crawler.types.regexp", () => {
  const crawler = new Crawler(
    load(`<div><span class="email">user@example.com</span></div>`)
  )

  it("matches email using regexp", () => {
    const result = crawler.get(
      ".email",
      Crawler.types.regexp(/\w+@\w+\.\w+/, Crawler.types.str)
    )
    expect(result).toBe("user@example.com")
  })

  it("matches page number using regexp in text", () => {
    const c = new Crawler(
      load(`<div><span class="page-number">Page 42</span></div>`)
    )
    const result = c.get(
      ".page-number",
      Crawler.types.regexp(/Page (\d+)/, Crawler.types.int),
      "text"
    )
    expect(result).toBe(42)
  })

  it("matches page number using regexp in href attr", () => {
    const c = new Crawler(load(`<a class="page-link" href="/page/42">Next</a>`))
    const result = c.get(
      ".page-link",
      Crawler.types.regexp(/\/page\/(\d+)$/, Crawler.types.int),
      ":href"
    )
    expect(result).toBe(42)
  })

  it("throws if no match found", () => {
    const c = new Crawler(
      load(`<div><span class="email">no-email</span></div>`)
    )
    expect(() =>
      c.get(".email", Crawler.types.regexp(/\w+@\w+\.\w+/, Crawler.types.str))
    ).toThrow("No match found for pattern")
  })
})

describe("Crawler.types.slug", () => {
  const crawler = new Crawler(
    load(`<a class="link" href="/anime/one-piece/ep-1000">Watch</a>`)
  )

  it("extracts slug from start index", () => {
    const result = crawler.get(".link", Crawler.types.slug(1), ":href")
    expect(result).toBe("one-piece/ep-1000")
  })

  it("extracts slug between two indexes", () => {
    const result = crawler.get(".link", Crawler.types.slug(1, 1), ":href")
    expect(result).toBe("one-piece")
  })

  it("handles trailing slashes", () => {
    const c = new Crawler(load(`<a class="link" href="/a/b/c/d/">test</a>`))
    const result = c.get(".link", Crawler.types.slug(1, 2), ":href")
    expect(result).toBe("b/c")
  })
})
