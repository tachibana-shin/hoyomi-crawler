import dayjs from "dayjs"
import { createConverter } from "../crawler"

export const dayjsConverter = (template: dayjs.OptionType) =>
  createConverter((input) => dayjs(input, template, true))
