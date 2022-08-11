require('dotenv').config()
require('./mongo')

const express = require('express')
const cors = require('cors')
const Note = require('./models/Note')

const app = express()
const Sentry = require('@sentry/node')
const Tracing = require('@sentry/tracing')
const requestLogger = require('./middleware/loggerMiddleware')
const unknownEndpoint = require('./middleware/unknownEndPoint')
const errorHandler = require('./middleware/errorHandler')

app.use(cors())
app.use(express.json())
app.use(requestLogger)

Sentry.init({
  dsn: 'https://6c9973de11ba447a8a213ce967c2c4bc@o1356325.ingest.sentry.io/6641732',
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Tracing.Integrations.Express({ app })
  ],

  tracesSampleRate: 1.0
})

app.use(Sentry.Handlers.requestHandler())

app.use(Sentry.Handlers.tracingHandler())

app.get('/', (req, res) => {
  res.send('<h1>Hello World!</h1>')
})

app.get('/api/notes', (req, res, next) => {
  Note.find({}).then((notes) => {
    res.json(notes)
  })
    .catch((err) => next(err))
})

app.get('/api/notes/:id', (req, res, next) => {
  const { id } = req.params
  Note.findById(id).then(note => {
    if (note) {
      return res.json(note)
    } else {
      res.status(404).end()
    }
  }).catch(err => next(err))
})

app.delete('/api/notes/:id', (req, res, next) => {
  const id = req.params.id
  Note.findByIdAndRemove(id).then(() => res.status(204).end())
    .catch(err => next(err))
})

app.put('/api/notes/:id', (req, res, next) => {
  const { id } = req.params
  const { body } = req

  const note = {
    content: body.content,
    important: body.important
  }

  Note.findByIdAndUpdate(id, note, { new: true }).then(updatedNote => {
    res.json(updatedNote)
  })
    .catch(err => next(err))
})

app.post('/api/notes/', (req, res, next) => {
  const { body } = req

  if (body.content === undefined) {
    return res.status(400).json({
      error: 'content missing'
    })
  }

  const note = new Note({
    content: body.content,
    important: body.important || false,
    date: new Date()
  })

  note.save().then(savedNote => {
    res.json(savedNote)
  }).catch(err => next(err))
})

app.use(unknownEndpoint)

app.use(Sentry.Handlers.errorHandler())

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
