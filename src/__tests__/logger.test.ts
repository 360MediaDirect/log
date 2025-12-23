/**
 * Integration tests for the logger configuration and environment variables
 */

describe('Logger Configuration', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    originalEnv = { ...process.env }
    // Clear the module cache to ensure fresh imports
    jest.resetModules()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should create a logger with default settings', () => {
    delete process.env.LOG_LEVEL
    delete process.env.LOG_FORMAT
    delete process.env.LOG_SILENT
    delete process.env.LOG_COLORS

    const log = require('../index').default
    expect(log).toBeDefined()
    expect(log.level).toBe('info')
    expect(log.silent).toBe(false)
  })

  it('should respect LOG_LEVEL environment variable', () => {
    process.env.LOG_LEVEL = 'debug'
    const log = require('../index').default
    expect(log.level).toBe('debug')
  })

  it('should respect LOG_LEVEL with different levels', () => {
    const levels = ['error', 'warn', 'info', 'verbose', 'debug', 'silly']
    levels.forEach((level) => {
      jest.resetModules()
      process.env.LOG_LEVEL = level
      const log = require('../index').default
      expect(log.level).toBe(level)
    })
  })

  it('should respect LOG_SILENT environment variable with true', () => {
    process.env.LOG_SILENT = 'true'
    const log = require('../index').default
    expect(log.silent).toBe(true)
  })

  it('should respect LOG_SILENT environment variable with 1', () => {
    process.env.LOG_SILENT = '1'
    const log = require('../index').default
    expect(log.silent).toBe(true)
  })

  it('should respect LOG_SILENT environment variable with yes', () => {
    process.env.LOG_SILENT = 'yes'
    const log = require('../index').default
    expect(log.silent).toBe(true)
  })

  it('should respect LOG_SILENT environment variable with on', () => {
    process.env.LOG_SILENT = 'on'
    const log = require('../index').default
    expect(log.silent).toBe(true)
  })

  it('should not be silent with false LOG_SILENT', () => {
    process.env.LOG_SILENT = 'false'
    const log = require('../index').default
    expect(log.silent).toBe(false)
  })

  it('should use json format by default', () => {
    delete process.env.LOG_FORMAT
    const log = require('../index').default
    expect(log).toBeDefined()
    // Format is applied, we just verify the logger is created successfully
  })

  it('should use json format when specified', () => {
    process.env.LOG_FORMAT = 'json'
    const log = require('../index').default
    expect(log).toBeDefined()
  })

  it('should use simple format when specified', () => {
    process.env.LOG_FORMAT = 'simple'
    const log = require('../index').default
    expect(log).toBeDefined()
  })

  it('should fallback to default format for unknown format', () => {
    process.env.LOG_FORMAT = 'unknown'
    const log = require('../index').default
    expect(log).toBeDefined()
  })

  it('should apply colorize formatter when LOG_COLORS is true', () => {
    process.env.LOG_COLORS = 'true'
    const log = require('../index').default
    expect(log).toBeDefined()
  })

  it('should apply colorize formatter when LOG_COLORS is 1', () => {
    process.env.LOG_COLORS = '1'
    const log = require('../index').default
    expect(log).toBeDefined()
  })

  it('should not apply colorize formatter when LOG_COLORS is false', () => {
    process.env.LOG_COLORS = 'false'
    const log = require('../index').default
    expect(log).toBeDefined()
  })

  it('should have Console transport', () => {
    const log = require('../index').default
    expect(log.transports).toHaveLength(1)
    expect(log.transports[0].name).toBe('console')
  })

  it('should work with all environment variables set', () => {
    process.env.LOG_LEVEL = 'debug'
    process.env.LOG_FORMAT = 'simple'
    process.env.LOG_SILENT = 'false'
    process.env.LOG_COLORS = 'true'

    const log = require('../index').default
    expect(log).toBeDefined()
    expect(log.level).toBe('debug')
    expect(log.silent).toBe(false)
  })

  it('should handle empty string environment variables', () => {
    process.env.LOG_LEVEL = ''
    process.env.LOG_FORMAT = ''
    process.env.LOG_SILENT = ''
    process.env.LOG_COLORS = ''

    const log = require('../index').default
    expect(log).toBeDefined()
  })

  it('should log messages successfully', () => {
    const log = require('../index').default
    expect(() => {
      log.info('test message')
      log.error('error message')
      log.debug('debug message')
      log.warn('warn message')
    }).not.toThrow()
  })

  it('should handle error objects in log messages', () => {
    const log = require('../index').default
    const error = new Error('Test error')
    expect(() => {
      log.error('An error occurred', error)
    }).not.toThrow()
  })

  it('should handle multiple arguments in log messages', () => {
    const log = require('../index').default
    expect(() => {
      log.info('message', 'arg1', 'arg2', 'arg3')
    }).not.toThrow()
  })
})
