export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'PL Analytics API',
    version: '1.0.0',
    description:
      'Professional football analytics: teams, players, matches, events, search and billing. Versioned under /api/v1; legacy /api is deprecated but compatible.',
  },
  servers: [{ url: '/api/v1', description: 'Versioned API' }],
  tags: [
    { name: 'health', description: 'Service health' },
    { name: 'teams', description: 'Teams' },
    { name: 'players', description: 'Players' },
    { name: 'matches', description: 'Matches' },
    { name: 'events', description: 'Shot maps and heatmaps (PRO)' },
    { name: 'analytics', description: 'Tables, scorers, radar (radar = PRO)' },
    { name: 'search', description: 'Meilisearch typeahead' },
    { name: 'billing', description: 'Stripe subscriptions' },
    { name: 'jobs', description: 'BullMQ background jobs (PRO)' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'API key' },
    },
    schemas: {
      ApiError: {
        type: 'object',
        required: ['code', 'message'],
        properties: {
          code: { type: 'string' },
          message: { type: 'string' },
        },
      },
      Paginated: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { type: 'object' } },
          total: { type: 'number' },
          page: { type: 'number' },
          pageSize: { type: 'number' },
          totalPages: { type: 'number' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['health'],
        summary: 'Health check',
        responses: { '200': { description: 'ok' } },
      },
    },
    '/teams': {
      get: {
        tags: ['teams'],
        summary: 'List teams',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', minimum: 0 } },
        ],
        responses: {
          '200': { description: 'paginated teams' },
          '400': { description: 'validation error' },
        },
      },
    },
    '/teams/{id}': {
      get: {
        tags: ['teams'],
        summary: 'Team detail',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'team' }, '404': { description: 'not found' } },
      },
    },
    '/players': {
      get: {
        tags: ['players'],
        summary: 'List players',
        parameters: [
          { name: 'seasonId', in: 'query', schema: { type: 'string' } },
          { name: 'teamId', in: 'query', schema: { type: 'string' } },
          { name: 'minMinutes', in: 'query', schema: { type: 'integer', minimum: 0 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100 } },
        ],
        responses: { '200': { description: 'paginated players' } },
      },
    },
    '/players/top/{metric}': {
      get: {
        tags: ['players'],
        summary: 'Top performers',
        parameters: [
          { name: 'metric', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100 } },
        ],
        responses: { '200': { description: 'leaders' } },
      },
    },
    '/matches': {
      get: {
        tags: ['matches'],
        summary: 'List matches',
        responses: { '200': { description: 'paginated matches' } },
      },
    },
    '/matches/live': {
      get: { tags: ['matches'], summary: 'Live matches', responses: { '200': { description: 'live' } } },
    },
    '/events/shots': {
      get: {
        tags: ['events'],
        summary: 'Shot map (PRO)',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'shots' }, '401': { description: 'unauthorized' }, '403': { description: 'requires PRO' } },
      },
    },
    '/analytics/table/{seasonId}': {
      get: {
        tags: ['analytics'],
        summary: 'League table',
        parameters: [{ name: 'seasonId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'standings' } },
      },
    },
    '/analytics/radar/{playerId}': {
      get: {
        tags: ['analytics'],
        summary: 'Player radar (PRO)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'playerId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'seasonId', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'radar' }, '401': { description: 'unauthorized' } },
      },
    },
    '/search': {
      get: {
        tags: ['search'],
        summary: 'Universal search',
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string', minLength: 2 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 50 } },
        ],
        responses: { '200': { description: 'results' } },
      },
    },
    '/billing/checkout': {
      post: {
        tags: ['billing'],
        summary: 'Create checkout (auth)',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'session' }, '400': { description: 'validation' } },
      },
    },
    '/jobs/ingest': {
      post: {
        tags: ['jobs'],
        summary: 'Enqueue competition ingest (PRO)',
        security: [{ bearerAuth: [] }],
        responses: { '202': { description: 'enqueued' }, '503': { description: 'queue unavailable' } },
      },
    },
  },
} as const;
