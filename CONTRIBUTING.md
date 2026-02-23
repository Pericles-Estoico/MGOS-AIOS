# Contributing to MGOS AIOS

This guide covers setting up your development environment, including Redis infrastructure.

## Redis Setup (Story 4.1)

Redis is used for job queue management, caching, and session management across the MGOS platform.

### Local Development

#### Option 1: Docker Compose (Recommended)

```bash
# Start Redis with Docker
docker-compose up redis

# Check Redis is running
curl http://localhost:3000/api/health/redis

# Response should be:
# { "status": "connected", "latency": "Xms", ... }
```

#### Option 2: Local Installation

```bash
# Install Redis (macOS)
brew install redis

# Start Redis
redis-server

# Test connection
redis-cli ping
# Response: PONG
```

#### Option 3: Remote Redis (Production/Staging)

Set environment variables in `.env`:

```env
REDIS_HOST_PROD=your-elasticache-endpoint.amazonaws.com
REDIS_PORT_PROD=6379
REDIS_PASSWORD_PROD=your-password
REDIS_SSL_PROD=true
```

### Configuration

Redis client automatically detects environment based on `NODE_ENV`:

- **development**: Uses `REDIS_HOST_DEV`, `REDIS_PORT_DEV`, etc.
- **production**: Uses `REDIS_HOST_PROD`, `REDIS_PORT_PROD`, etc.

Default values:

```
Development:
  - Host: localhost
  - Port: 6379
  - Password: (empty)

Production:
  - Host: redis.prod.example.com
  - Port: 6379
  - SSL: enabled
```

### Connection Pooling

The Redis client uses ioredis with:

- **Pool size**: 50 connections (dev), 100 (prod)
- **Retry logic**: Exponential backoff (1s → 30s max)
- **Max retries**: 5 attempts
- **Health checks**: PING command with latency tracking

### Health Check

```bash
# Manual health check
curl http://localhost:3000/api/health/redis

# Response format
{
  "status": "connected",
  "latency": "2ms",
  "timestamp": "2026-02-23T18:35:00Z",
  "metrics": {
    "connections": 1,
    "commands": 0,
    "errors": 0,
    "averageLatency": "2ms"
  },
  "message": "✅ Redis is healthy"
}
```

### Monitoring

Access Redis Commander UI for development:

```bash
docker-compose --profile debug up redis-commander

# UI available at: http://localhost:8081
```

### Testing

Run Redis tests:

```bash
npm test -- __tests__/redis-client.test.ts

# Expected output: 14/14 tests passing
# Note: Tests require Redis running (local or Docker)
```

### Troubleshooting

**Connection refused on localhost:6379**

```bash
# Check Redis is running
redis-cli ping

# If not running, start with Docker
docker-compose up redis

# Or install locally and start
brew install redis && redis-server
```

**Connection timeout to production Redis**

1. Verify credentials in `.env.local`
2. Check security group rules in AWS (port 6379 must be open)
3. Verify SSL configuration if required
4. Test connectivity: `redis-cli -h your-host -p 6379 -a password ping`

**High latency (>50ms)**

- Check network connectivity
- Verify Redis instance is not overloaded
- Review `GET /api/health/redis` metrics
- Monitor with Redis Commander UI

## Development Workflow

1. **Start Redis**

   ```bash
   docker-compose up redis
   ```

2. **Verify connection**

   ```bash
   curl http://localhost:3000/api/health/redis
   ```

3. **Run tests**

   ```bash
   npm test
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

## Production Deployment

For AWS ElastiCache:

1. Create ElastiCache Redis cluster
2. Configure security groups (allow port 6379 from app subnet)
3. Copy endpoint URL to `REDIS_HOST_PROD`
4. Set `REDIS_PASSWORD_PROD` from cluster auth token
5. Enable SSL: `REDIS_SSL_PROD=true`
6. Deploy application

See `terraform/redis.tf` for infrastructure-as-code example.

---

For more information, see:
- [Redis Documentation](https://redis.io/docs/)
- [ioredis Documentation](https://github.com/luin/ioredis)
- [Story 4.1: Redis Infrastructure](docs/stories/4.1-redis-infrastructure.story.md)
