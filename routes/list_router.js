const Router = require('koa-router')
const list_ctrl = require('./../app/controllers/list_ctrl')

const router = new Router()

router.post('/list/share/join', list_ctrl.joinShareList)
router.post('/list/share/open', list_ctrl.openShare)

module.exports = router