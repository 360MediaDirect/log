# @360mediadirect/log

A pre-configured Winston logger with enhanced error formatting and environment-based configuration.

## Features

- 🚀 **Zero Configuration** - Works out of the box with sensible defaults
- 🔧 **Environment-Based** - Configure via environment variables
- 🐛 **Enhanced Error Handling** - Automatic formatting of Error objects with stack traces
- 🎨 **Multiple Formats** - Support for JSON, simple, and custom formats
- 🌈 **Colorization** - Optional colored output for better readability
- 📊 **HTTP Error Support** - Special handling for errors with `response` and `request` properties
- ✅ **Fully Tested** - 96%+ code coverage

## Installation

```bash
npm install @360mediadirect/log
```

## Quick Start

```typescript
import log from '@360mediadirect/log'

// Basic logging
log.info('Application started')
log.error('Something went wrong')
log.debug('Debug information')
log.warn('Warning message')

// Logging with additional data
log.info('User logged in', { userId: 123, username: 'john' })

// Logging errors
try {
  throw new Error('Something failed')
} catch (error) {
  log.error('Operation failed', error)
}
```

## Environment Variables

Configure the logger using environment variables:

| Variable | Description | Default | Options |
|----------|-------------|---------|---------|
| `LOG_LEVEL` | Logging level | `info` | `error`, `warn`, `info`, `verbose`, `debug`, `silly` |
| `LOG_FORMAT` | Output format | `default` | `json`, `simple`, `default` |
| `LOG_SILENT` | Suppress all output | `false` | `true`, `yes`, `on`, `1` |
| `LOG_COLORS` | Enable colored output | `false` | `true`, `yes`, `on`, `1` |

### Example Configuration

```bash
# Set log level to debug
LOG_LEVEL=debug

# Use simple format
LOG_FORMAT=simple

# Enable colors
LOG_COLORS=true

# Run your application
npm start
```

## Log Levels

The logger supports standard Winston log levels (in order of priority):

1. `error` - Error messages
2. `warn` - Warning messages
3. `info` - Informational messages (default)
4. `verbose` - Verbose messages
5. `debug` - Debug messages
6. `silly` - Very detailed debug messages

## Error Formatting

The logger includes special handling for Error objects:

```typescript
// Standard error
const error = new Error('Database connection failed')
log.error('Failed to connect', error)
// Output includes formatted stack trace

// HTTP errors (with response property)
const httpError = new Error('Request failed')
httpError.response = {
  data: { message: 'Not Found' },
  status: 404,
  headers: { 'content-type': 'application/json' }
}
log.error('API request failed', httpError)
// Output includes error, errorResponse with parsed data

// Errors with request information
httpError.request = {
  method: 'GET',
  url: '/api/users'
}
log.error('Request failed', httpError)
// Output includes error, errorResponse, and errorRequest
```

### Error Output Format

Errors are automatically formatted with:
- **Stack traces** - Newlines replaced with ` | ` for single-line output
- **Response data** - JSON-parsed if possible
- **HTTP status** - Status codes from error responses
- **Request info** - Request method, URL, and other details

## Output Formats

### JSON Format (default)

```json
{
  "level": "info",
  "message": "User logged in",
  "userId": 123,
  "timestamp": "2025-12-23T12:00:00.000Z"
}
```

### Simple Format

```
info: User logged in userId=123
```

## API

### Default Export

The main export is a pre-configured Winston logger instance.

```typescript
import log from '@360mediadirect/log'

log.error('Error message')
log.warn('Warning message')
log.info('Info message')
log.verbose('Verbose message')
log.debug('Debug message')
log.silly('Silly message')
```

### Named Exports

The package also exports utility functions for advanced usage:

#### `freeKey(obj: any, key: string): string`

Finds the first available key name in an object, appending an index if needed.

```typescript
import { freeKey } from '@360mediadirect/log'

freeKey({}, 'foo')                      // 'foo'
freeKey({ foo: 'bar' }, 'foo')          // 'foo0'
freeKey({ foo: 'bar', foo0: 'baz' }, 'foo')  // 'foo1'
```

#### `getValue<T, K>(object: T, key: K): T[K]`

Type-safe helper to retrieve values from objects, including Symbol-indexed properties.

```typescript
import { getValue } from '@360mediadirect/log'

const obj = { name: 'John' }
getValue(obj, 'name')  // 'John'
```

#### `isTrueEnv(val: string): boolean`

Tests if an environment variable string represents a truthy value.

```typescript
import { isTrueEnv } from '@360mediadirect/log'

isTrueEnv('true')   // true
isTrueEnv('1')      // true
isTrueEnv('yes')    // true
isTrueEnv('on')     // true
isTrueEnv('false')  // false
```

#### `maybeJSON(str: string): string | object`

Parses a string as JSON if possible, otherwise returns the original string.

```typescript
import { maybeJSON } from '@360mediadirect/log'

maybeJSON('{"foo":"bar"}')  // { foo: 'bar' }
maybeJSON('not json')        // 'not json'
```

#### `errorFormatter(options?: { pipeNewline?: boolean })`

Winston formatter for enhanced error handling.

```typescript
import { errorFormatter } from '@360mediadirect/log'
import { format } from 'winston'

const customFormatter = format.combine(
  errorFormatter({ pipeNewline: true }),
  format.json()
)
```

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Building

```bash
# Compile TypeScript
npm run build

# Clean build artifacts
npm run clean
```

## Test Coverage

The package maintains high test coverage:

- **Statements**: 100%
- **Branches**: 96.42%
- **Functions**: 100%
- **Lines**: 100%

## TypeScript Support

This package includes TypeScript definitions out of the box. No additional `@types` package needed.

```typescript
import log from '@360mediadirect/log'

// Full TypeScript support
log.info('Typed message', { count: 123 })
```

## License

UNLICENSED

## Author

Tom Shawver <tom@360mediadirect.com>

## Repository

https://github.com/360MediaDirect/log
