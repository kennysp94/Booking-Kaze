# Kaze-Cal.com Integration

This backend system connects Cal.com's open-source scheduling solution with the Kaze calendar API to provide real-time booking functionality for plumbing services.

## Features

- **Real-time Availability**: Fetches available time slots from Kaze API
- **Seamless Booking**: Creates bookings directly in Kaze system
- **Cal.com Compatible**: Provides endpoints that work with Cal.com frontend
- **Service Management**: Handles different plumbing services and technician assignments
- **Authentication**: Secure API token-based authentication with Kaze

## API Endpoints

### Kaze Direct Integration

- `POST /api/kaze/auth` - Authenticate with Kaze API
- `GET /api/kaze/availability` - Get available time slots
- `POST /api/kaze/booking` - Create a new booking
- `GET /api/kaze/booking` - Get booking details
- `GET /api/kaze/services` - Get available services
- `GET /api/kaze/technicians` - Get available technicians

### Cal.com Compatible Endpoints

- `GET /api/cal/availability` - Cal.com compatible availability endpoint
- `POST /api/cal/bookings` - Cal.com compatible booking endpoint

## Setup

1. **Environment Variables**
   \`\`\`
   KAZE_API_TOKEN=your_kaze_api_token
   KAZE_API_URL=https://api.kaze.com (optional, defaults to this)
   \`\`\`

2. **Authentication**
   - Use the `/api/kaze/auth` endpoint to get a token
   - Include the token in subsequent requests as `Authorization: Bearer <token>`

3. **Cal.com Integration**
   - Point your Cal.com instance to use `/api/cal/availability` and `/api/cal/bookings`
   - Pass the Kaze token via `x-kaze-token` header or set `KAZE_API_TOKEN` environment variable

## Usage Examples

### Get Available Slots
\`\`\`javascript
const response = await fetch('/api/kaze/availability?date=2024-01-15&serviceId=plumbing-basic', {
  headers: {
    'Authorization': 'Bearer your_token'
  }
});
const { slots } = await response.json();
\`\`\`

### Create a Booking
\`\`\`javascript
const booking = await fetch('/api/kaze/booking', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your_token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    start_time: '2024-01-15T10:00:00Z',
    end_time: '2024-01-15T11:00:00Z',
    customer_name: 'John Doe',
    customer_email: 'john@example.com',
    customer_phone: '+1234567890',
    service_id: 'plumbing-basic',
    notes: 'Kitchen sink repair'
  })
});
\`\`\`

## Integration with Cal.com

1. **Clone Cal.com**: `git clone https://github.com/calcom/cal.com.git`
2. **Configure API endpoints**: Update Cal.com configuration to use your backend endpoints
3. **Set environment variables**: Add Kaze API credentials
4. **Deploy**: Deploy both Cal.com frontend and this backend system

## Error Handling

All endpoints return standardized error responses:
\`\`\`json
{
  "success": false,
  "error": "Error message description"
}
\`\`\`

## Security

- All Kaze API calls are authenticated with bearer tokens
- Input validation on all booking requests
- CORS headers configured for frontend integration
- Rate limiting recommended for production use

## Next Steps

1. Deploy this backend to your preferred hosting platform
2. Configure Cal.com to use these endpoints
3. Set up your Kaze API credentials
4. Test the complete booking flow
5. Add any custom business logic or validation rules
