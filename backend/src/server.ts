import cors from 'cors'
import express from 'express'
import { profilePayload } from './data/profile.js'

const app = express()
const port = Number(process.env.PORT ?? 4000)

app.use(cors())

app.get('/health', (_request, response) => {
  response.json({
    ok: true,
    service: 'profile-backend',
  })
})

app.get('/profile', (_request, response) => {
  response.json(profilePayload)
})

app.listen(port, () => {
  console.log(`Profile backend listening on http://localhost:${port}`)
})
