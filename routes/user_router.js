const Router = require('koa-router')
const user_ctrl = require('./../app/controllers/user_ctrl')

const router = new Router()

router.get('/user/list', user_ctrl.getAllUsername)
router.get('/user/profile', user_ctrl.getProfile)
router.post('/user/import/wunderList', user_ctrl.importFromWunderList)
router.post('/user/checkIfjoinedList', user_ctrl.checkIfjoinedList)
router.post('/user/sendEmail', user_ctrl.sendEmail)
router.post('/user/vertify/invitationToken', user_ctrl.checkInvitationToken)
router.post('/user/vertify/email', user_ctrl.checkEmail)
router.post('/user/vertify/username', user_ctrl.checkUsername)
router.post('/user/vertify/password', user_ctrl.checkPassword)
router.post('/user/login', user_ctrl.login)
router.post('/user/register', user_ctrl.register)
router.post('/user/update/profile', user_ctrl.updateProfile)
router.post('/user/update/username', user_ctrl.updateUsername)
router.post('/user/update/email', user_ctrl.changeEmail)
router.post('/user/update/password', user_ctrl.changePassword)
router.post('/user/reset/password', user_ctrl.forgetPassword)

module.exports = router