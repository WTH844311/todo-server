const koa = require('koa')
const config = require('./config')
const bodyParser = require('koa-bodyparser')
const mongoose = require('mongoose')
const vertify = require('./app/middlewares/vertify')
const getISOCurrentTime = require('./app/middlewares/getISOCurrentTime')
const app = new koa()
const cors = require('koa2-cors')
const formidable = require('koa2-formidable')

mongoose.connect(config.db, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }, err => {
    err ? console.error('Failed to connect to database') : console.log('Connecting database successfully')
})

require('./schedule')
app.use(cors({
    origin: '*',
}))
app.use(formidable())
app.use(bodyParser())
app.use(vertify)
app.use(getISOCurrentTime)


const user_router = require('./routes/user_router')
const list_router = require('./routes/list_router')
const task_router = require('./routes/task_router')

app.use(user_router.routes()).use(user_router.allowedMethods())
app.use(list_router.routes()).use(list_router.allowedMethods())
app.use(task_router.routes()).use(task_router.allowedMethods())

app.listen(config.port)
