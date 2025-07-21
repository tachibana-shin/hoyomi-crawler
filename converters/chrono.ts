// biome-ignore assist/source/organizeImports: <false>
import { parseDate } from "chrono-node"
import type { ParsingOption, ParsingReference } from "chrono-node"

import { createConverter } from "../crawler"

export const chronoConverter = (
  ref?: ParsingReference | Date,
  option?: ParsingOption
) => createConverter((input: string) => parseDate(input, ref, option))
