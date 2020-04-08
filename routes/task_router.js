const Router = require('koa-router')
const task_ctrl = require('../app/controllers/task_ctrl')

const router = new Router()

router.post('/task/uploadFile', task_ctrl.uploadFile)

module.exports = router