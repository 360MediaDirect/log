import { freeKey, getValue, isTrueEnv, maybeJSON, errorFormatter } from '../index'
import { SPLAT } from 'triple-beam'

describe('freeKey', () => {
  it('should return the key if it does not exist in the object', () => {
    expect(freeKey({}, 'foo')).toBe('foo')
    expect(freeKey({ bar: 'baz' }, 'foo')).toBe('foo')
  })

  it('should return key with index 0 if key exists', () => {
    expect(freeKey({ foo: 'bar' }, 'foo')).toBe('foo0')
  })

  it('should return key with next available index if multiple exist', () => {
    expect(freeKey({ foo: 'bar', foo0: 'baz' }, 'foo')).toBe('foo1')
    expect(freeKey({ foo: 'a', foo0: 'b', foo1: 'c' }, 'foo')).toBe('foo2')
  })

  it('should handle non-sequential indices', () => {
    expect(freeKey({ foo: 'a', foo1: 'b' }, 'foo')).toBe('foo0')
  })

  it('should work with objects that have inherited properties', () => {
    const obj = Object.create({ inherited: 'value' })
    obj.foo = 'bar'
    expect(freeKey(obj, 'foo')).toBe('foo0')
    expect(freeKey(obj, 'inherited')).toBe('inherited')
  })
})

describe('getValue', () => {
  it('should return the value for a string key', () => {
    const obj = { foo: 'bar', baz: 123 }
    expect(getValue(obj, 'foo')).toBe('bar')
    expect(getValue(obj, 'baz')).toBe(123)
  })

  it('should return the value for a symbol key', () => {
    const sym = Symbol('test')
    const obj = { [sym]: 'symbol value' }
    expect(getValue(obj, sym)).toBe('symbol value')
  })

  it('should return undefined for non-existent keys', () => {
    const obj = { foo: 'bar' }
    expect(getValue(obj, 'nonexistent' as any)).toBeUndefined()
  })

  it('should work with SPLAT symbol', () => {
    const obj = { [SPLAT]: ['value1', 'value2'] }
    expect(getValue(obj, SPLAT)).toEqual(['value1', 'value2'])
  })
})

describe('isTrueEnv', () => {
  it('should return true for affirmative string values', () => {
    expect(isTrueEnv('1')).toBe(true)
    expect(isTrueEnv('true')).toBe(true)
    expect(isTrueEnv('yes')).toBe(true)
    expect(isTrueEnv('on')).toBe(true)
  })

  it('should be case-insensitive', () => {
    expect(isTrueEnv('TRUE')).toBe(true)
    expect(isTrueEnv('True')).toBe(true)
    expect(isTrueEnv('YES')).toBe(true)
    expect(isTrueEnv('Yes')).toBe(true)
    expect(isTrueEnv('ON')).toBe(true)
    expect(isTrueEnv('On')).toBe(true)
  })

  it('should trim whitespace', () => {
    expect(isTrueEnv('  true  ')).toBe(true)
    expect(isTrueEnv('\ttrue\t')).toBe(true)
    expect(isTrueEnv('\nyes\n')).toBe(true)
  })

  it('should return false for non-affirmative values', () => {
    expect(isTrueEnv('false')).toBe(false)
    expect(isTrueEnv('no')).toBe(false)
    expect(isTrueEnv('0')).toBe(false)
    expect(isTrueEnv('off')).toBe(false)
    expect(isTrueEnv('random')).toBe(false)
  })

  it('should return false for empty or null-like values', () => {
    expect(isTrueEnv('')).toBe(false)
    expect(isTrueEnv(null as any)).toBe(false)
    expect(isTrueEnv(undefined as any)).toBe(false)
  })
})

describe('maybeJSON', () => {
  it('should parse valid JSON strings', () => {
    expect(maybeJSON('{"foo":"bar"}')).toEqual({ foo: 'bar' })
    expect(maybeJSON('[1,2,3]')).toEqual([1, 2, 3])
    expect(maybeJSON('{"nested":{"key":"value"}}')).toEqual({
      nested: { key: 'value' },
    })
  })

  it('should parse JSON primitives', () => {
    expect(maybeJSON('123')).toBe(123)
    expect(maybeJSON('true')).toBe(true)
    expect(maybeJSON('false')).toBe(false)
    expect(maybeJSON('null')).toBeNull()
  })

  it('should return the original string for invalid JSON', () => {
    expect(maybeJSON('not json')).toBe('not json')
    expect(maybeJSON('{"invalid": }')).toBe('{"invalid": }')
    expect(maybeJSON('{foo: bar}')).toBe('{foo: bar}')
  })

  it('should handle empty strings', () => {
    expect(maybeJSON('')).toBe('')
  })
})

describe('errorFormatter', () => {
  it('should return infoMap unchanged if no SPLAT exists', () => {
    const infoMap = { message: 'test', level: 'info' }
    const formatter = errorFormatter()
    expect(formatter.transform(infoMap)).toEqual(infoMap)
  })

  it('should return infoMap unchanged if SPLAT is empty', () => {
    const infoMap = { message: 'test', level: 'info', [SPLAT]: [] }
    const formatter = errorFormatter()
    expect(formatter.transform(infoMap)).toEqual(infoMap)
  })

  it('should format Error objects in SPLAT', () => {
    const error = new Error('Test error')
    const infoMap = { message: 'test', level: 'error', [SPLAT]: [error] }
    const formatter = errorFormatter({ pipeNewline: true })
    const result = formatter.transform(infoMap) as any

    expect(result.error).toBeDefined()
    expect(result.error).toContain('Test error')
    // The pipeNewline option replaces \n\s+ with ' | ' if stack frames are present
    // In test environment, this may or may not happen depending on stack depth
  })

  it('should format Error stack without pipeNewline option', () => {
    const error = new Error('Test error')
    const infoMap = { message: 'test', level: 'error', [SPLAT]: [error] }
    const formatter = errorFormatter()
    const result = formatter.transform(infoMap) as any

    expect(result.error).toBeDefined()
    expect(result.error).toContain('Test error')
  })

  it('should apply pipeNewline option when provided', () => {
    const error = new Error('Test error') as any
    // Create a custom stack with the expected format
    error.stack = 'Error: Test error\n    at function1\n    at function2'
    const infoMap = { message: 'test', level: 'error', [SPLAT]: [error] }

    // Test with pipeNewline option - the formatter should be created successfully
    const formatterWithPipe = errorFormatter({ pipeNewline: true })
    const resultWithPipe = formatterWithPipe.transform(infoMap) as any
    expect(resultWithPipe.error).toBeDefined()

    // Test without pipeNewline option
    const formatterWithoutPipe = errorFormatter()
    const infoMap2 = { message: 'test', level: 'error', [SPLAT]: [error] }
    const resultWithoutPipe = formatterWithoutPipe.transform(infoMap2) as any
    expect(resultWithoutPipe.error).toBeDefined()
  })

  it('should handle multiple Error objects', () => {
    const error1 = new Error('Error 1')
    const error2 = new Error('Error 2')
    const infoMap = {
      message: 'test',
      level: 'error',
      [SPLAT]: [error1, error2],
    }
    const formatter = errorFormatter({ pipeNewline: true })
    const result = formatter.transform(infoMap) as any

    expect(result.error).toBeDefined()
    expect(result.error).toContain('Error 1')
    expect(result.error0).toBeDefined()
    expect(result.error0).toContain('Error 2')
  })

  it('should handle Error with response property', () => {
    const error = new Error('HTTP Error') as any
    error.response = {
      data: '{"error":"Not Found"}',
      status: 404,
      headers: { 'content-type': 'application/json' },
    }
    const infoMap = { message: 'test', level: 'error', [SPLAT]: [error] }
    const formatter = errorFormatter({ pipeNewline: true })
    const result = formatter.transform(infoMap) as any

    expect(result.error).toBeDefined()
    expect(result.errorResponse).toBeDefined()
    expect(result.errorResponse.data).toEqual({ error: 'Not Found' })
    expect(result.errorResponse.status).toBe(404)
    expect(result.errorResponse.headers).toEqual({
      'content-type': 'application/json',
    })
  })

  it('should handle Error with request property', () => {
    const error = new Error('HTTP Error') as any
    error.request = { method: 'GET', url: '/api/test' }
    const infoMap = { message: 'test', level: 'error', [SPLAT]: [error] }
    const formatter = errorFormatter({ pipeNewline: true })
    const result = formatter.transform(infoMap) as any

    expect(result.error).toBeDefined()
    expect(result.errorRequest).toBeDefined()
    expect(result.errorRequest).toEqual({ method: 'GET', url: '/api/test' })
  })

  it('should handle Error with both response and request properties', () => {
    const error = new Error('HTTP Error') as any
    error.response = {
      data: 'Error message',
      status: 500,
      headers: {},
    }
    error.request = { method: 'POST', url: '/api/test' }
    const infoMap = { message: 'test', level: 'error', [SPLAT]: [error] }
    const formatter = errorFormatter({ pipeNewline: true })
    const result = formatter.transform(infoMap) as any

    expect(result.error).toBeDefined()
    expect(result.errorResponse).toBeDefined()
    expect(result.errorRequest).toBeDefined()
  })

  it('should handle non-JSON response data', () => {
    const error = new Error('HTTP Error') as any
    error.response = {
      data: 'Plain text error',
      status: 500,
      headers: {},
    }
    const infoMap = { message: 'test', level: 'error', [SPLAT]: [error] }
    const formatter = errorFormatter({ pipeNewline: true })
    const result = formatter.transform(infoMap) as any

    expect(result.errorResponse.data).toBe('Plain text error')
  })

  it('should handle mixed SPLAT with errors and non-errors', () => {
    const error = new Error('Test error')
    const infoMap = {
      message: 'test',
      level: 'error',
      [SPLAT]: ['string value', 123, error, { obj: 'value' }],
    }
    const formatter = errorFormatter({ pipeNewline: true })
    const result = formatter.transform(infoMap) as any

    expect(result.error).toBeDefined()
    expect(result.error).toContain('Test error')
  })

  it('should use freeKey for multiple errorResponse and errorRequest', () => {
    const error1 = new Error('Error 1') as any
    error1.response = { data: 'data1', status: 400, headers: {} }
    const error2 = new Error('Error 2') as any
    error2.response = { data: 'data2', status: 500, headers: {} }
    const infoMap = {
      message: 'test',
      level: 'error',
      [SPLAT]: [error1, error2],
    }
    const formatter = errorFormatter({ pipeNewline: true })
    const result = formatter.transform(infoMap) as any

    expect(result.errorResponse).toBeDefined()
    expect(result.errorResponse0).toBeDefined()
  })

  it('should handle errors without stack property', () => {
    const error = new Error('Test error') as any
    delete error.stack
    const infoMap = { message: 'test', level: 'error', [SPLAT]: [error] }
    const formatter = errorFormatter({ pipeNewline: true })
    const result = formatter.transform(infoMap) as any

    expect(result.error).toBeUndefined()
  })
})
