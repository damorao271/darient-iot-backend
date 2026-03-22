import type { OpenAPIObject } from '@nestjs/swagger';

/**
 * Standardized success response wrapper schema.
 * All successful responses follow this structure.
 */
export const successResponseSchema = {
  type: 'object',
  required: ['success', 'statusCode', 'message', 'data', 'timestamp', 'path'],
  properties: {
    success: { type: 'boolean', example: true },
    statusCode: { type: 'number', example: 200 },
    message: { type: 'string', example: 'Resource retrieved successfully' },
    data: { description: 'Response payload - entity, array, or paginated result' },
    timestamp: {
      type: 'string',
      format: 'date-time',
      example: '2026-03-21T22:15:00.000Z',
    },
    path: { type: 'string', example: '/places' },
  },
};

/**
 * Standardized error response wrapper schema.
 * All error responses (4xx, 5xx) follow this structure.
 */
export const errorResponseSchema = {
  type: 'object',
  required: ['success', 'statusCode', 'message', 'error', 'timestamp', 'path'],
  properties: {
    success: { type: 'boolean', example: false },
    statusCode: { type: 'number', example: 400 },
    message: { type: 'string', example: 'Validation failed' },
    error: { type: 'string', example: 'Bad Request' },
    details: {
      type: 'array',
      description: 'Validation or business rule details',
      items: {
        type: 'object',
        properties: {
          field: { type: 'string', example: 'startTime' },
          issue: { type: 'string', example: 'startTime must be a future date' },
        },
      },
    },
    timestamp: {
      type: 'string',
      format: 'date-time',
      example: '2026-03-21T22:16:00.000Z',
    },
    path: { type: 'string', example: '/places' },
    errorCode: {
      type: 'string',
      example: 'ERR_VALIDATION',
      description: 'Machine-readable error code for client handling',
    },
  },
};

/**
 * Adds standardized response schemas to the OpenAPI document.
 */
export function addResponseSchemas(document: OpenAPIObject): void {
  document.components = document.components ?? {};
  document.components.schemas = {
    ...document.components.schemas,
    SuccessResponse: successResponseSchema,
    ErrorResponse: errorResponseSchema,
  };
}
