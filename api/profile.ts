import type { IncomingMessage, ServerResponse } from 'node:http'
import { profilePayload } from '../backend/src/data/profile.js'

export default function handler(_request: IncomingMessage, response: ServerResponse) {
  response.setHeader('Content-Type', 'application/json')
  response.statusCode = 200
  response.end(JSON.stringify(profilePayload))
}
