/* istanbul ignore file */
import { format, createLogger, transports } from 'winston'
import { SPLAT } from 'triple-beam'

const { LOG_LEVEL, LOG_FORMAT, LOG_SILENT, LOG_COLORS } = process.env
const formatName = LOG_FORMAT || 'default'

type WinstonInfo = Record<string | symbol, any>

/**
 * Given an object and a key string, this function will return the key if it's
 * not currently used, or the key with an index number appended to it for the
 * first available free key. For example:
 *
 *     freeKey({}, 'foo') // "foo"
 *     freeKey({ foo: 'bar' }, 'foo') // "foo0"
 *     freeKey({ foo: 'bar', foo0: 'bar' }, 'foo') // "foo1"
 *
 * @param obj The object on which to find a free key
 * @param key The chosen key
 * @returns the first free key of the chosen prefix.
 */
function freeKey(obj: any, key: string): string {
  if (!obj.hasOwnProperty(key)) return key
  let idx = 0
  let newKey: string
  do {
    newKey = `${key}${idx++}`
  } while (obj.hasOwnProperty(newKey))
  return newKey
}

/**
 * Pulls a value out of an object. This is a TypeScript workaround to access
 * Symbol-indexed properties of an object without complaining.
 * @param object Any object
 * @param key Any key that may or may not exist on that object
 * @returns the value of the given object's given key
 */
function getValue<T, K extends keyof T>(object: T, key: K): T[K] {
  return object[key]
}

/**
 * Tests a string for case-insensitive affirmative values, like `1`, `True`,
 * `yes`, and `on`.
 * @param val The value to be testing for truthiness
 * @returns `true` if an affirmative value was found; `false` otherwise.
 */
function isTrueEnv(val: string): boolean {
  if (!val) return false
  const truthy = ['1', 'true', 'yes', 'on']
  val = val.trim().toLowerCase()
  return truthy.includes(val)
}

/**
 * Parses a JSON string and returns the result if the string is valid JSON, or
 * returns the original string if not.
 * @param str The string that might be JSON
 * @returns An object parsed from the JSON, or the original string
 */
function maybeJSON(str: string): string | Record<string, any> {
  try {
    return JSON.parse(str)
  } catch (_e) {
    return str
  }
}

/**
 * A Winston formatter that catches raw Error objects passed as any argument
 * of a log function, and saves a nicely-formatted version to the `error` key.
 * If multiple `error` keys are defined, this function will save them as
 * `error0`, `error1`, etc.
 */
const errorFormatter = format((infoMap, opts = {}) => {
  const splat = getValue(infoMap as WinstonInfo, SPLAT)
  if (!splat) return infoMap
  splat.forEach((elem: any) => {
    if (elem instanceof Error) {
      infoMap[freeKey(infoMap, 'error')] = opts.pipeNewline
        ? elem.stack.replace(/\n\s+/g, ' | ')
        : elem.stack
      if ((elem as any).response) {
        const res = (elem as any).response
        infoMap[freeKey(infoMap, 'errorResponse')] = {
          data: maybeJSON(res.data),
          status: res.status,
          headers: res.headers
        }
      }
      if ((elem as any).request) {
        infoMap[freeKey(infoMap, 'errorRequest')] = (elem as any).request
      }
    }
  })
  return infoMap
})

const formats = {
  default: format.json(),
  json: format.json(),
  simple: format.simple()
}

const formatters = []
formatters.push(errorFormatter({ pipeNewline: true }))
if (isTrueEnv(LOG_COLORS)) formatters.push(format.colorize())
formatters.push(format.timestamp())

const log = createLogger({
  level: LOG_LEVEL || 'info',
  silent: isTrueEnv(LOG_SILENT),
  format: format.combine(
    ...formatters,
    formats[formatName] ? formats[formatName] : formats.default
  ),
  transports: [new transports.Console()]
})

export default log
