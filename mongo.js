const mongoose = require('mongoose')

const url = process.env.MONGO_DB_URI
mongoose.connect(url)
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })

process.on('uncaughtException', () => {
  mongoose.connection.disconnect()
})
