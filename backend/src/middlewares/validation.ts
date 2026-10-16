import { validator } from 'hono/validator'

export const validatePositiveIntParam = (paramName: string) =>
  validator('param', (value, c) => {
    const rawValue = value[paramName]
    const parsedValue = Number(rawValue)

    if (!Number.isInteger(parsedValue) || parsedValue < 1) {
      return c.json(
        {
          success: false,
          message: `${paramName} must be a positive integer`,
        },
        400
      )
    }

    return value
  })

export const validatePagination = validator('query', (value, c) => {
  const page = Number(value.page ?? '1')
  const limit = Number(value.limit ?? '10')

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    return c.json(
      {
        success: false,
        message: 'Page must be positive and limit must be between 1 and 100',
      },
      400
    )
  }

  return value
})