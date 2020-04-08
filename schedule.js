const schedule = require('node-schedule')
const task_mod = require('./app/models/task_mod')
const user_mod = require('./app/models/user_mod')
const captcha_mod = require('./app/models/captcha_mod')
const config = require('./config')
const jwt = require('jsonwebtoken')

/**
    *  *  *  *  *  *
    ┬  ┬  ┬  ┬  ┬  ┬
    │  │  │  │  │  └ day of week (0 - 7) (0 or 7 is Sun)
    │  │  │  │  └───── month (1 - 12)
    │  │  │  └────────── day of month (1 - 31)
    │  │  └─────────────── hour (0 - 23)
    │  └──────────────────── minute (0 - 59)
    └───────────────────────── second (0 - 59, OPTIONAL)
*/
schedule.scheduleJob('0 0 0 * * *', () => {
    checkCaptcha()
    checkToken()
    resetMyDay()
})

// 排查所有验证码，移除过期验证码
const checkCaptcha = async () => {
    const captchaArr = await captcha_mod.find()
    captchaArr.map(captcha => {
        if (Date.now() >= captcha.exp) {
            captcha_mod.deleteOne(captcha)
        }
    })
}

// 过期的 token 自动删除
const checkToken = async () => {
    // 全部含有 token 的 doc
    const users = await user_mod.find({
        token: { $exists: true }
    })

    users.map(v => {
        if (!v.token) return
        const decoded = jwt.verify(v.token, config.secretKey)
        if (Date.now() >= decoded.exp) {
            // token 过期
            user_mod.updateOne({
                _id: v._id
            }, {
                token: null
            })
        }
    })
}

// 移除所有任务的 “我的一天” 属性
const resetMyDay = async () => {
    await task_mod.updateMany({}, {
        myDay: false
    })
}