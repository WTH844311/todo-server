const jsonwebtoken = require('jsonwebtoken')
const config = require('./../../config')
const passport = require('./../utils/passport')
const User_mod = require('./../models/user_mod')
const List_mod = require('./../models/list_mod')
const Captcha_mod = require('./../models/captcha_mod')
const emailSenter = require('../utils/email')
const axios = require('axios')

/**
 * 生成验证码，发送邮箱
 * @param {邮箱} email 
 */
const sendEmail = async (ctx, next) => {
    const { email } = ctx.request.body
    // 生成验证码
    const captcha = parseInt(Math.random() * Math.pow(10, 6))
    const exp = Date.now() + 15 * 60 * 1000  // 有效期 30 分钟
    await Captcha_mod.create({
        email,
        captcha,
        exp
    })
    const mail = {
        // 发件邮箱
        from: config.email.auth.user,
        // 主题
        subject: '验证邮箱',
        // 收件邮箱
        to: email,
        // 邮箱内容
        text: `验证码：${captcha}`
    }
    emailSenter.sendMail(mail, err => {
        if (err) {
            console.log(err)
        }
    })
    ctx.body = {
        code: 1,
        msg: 'Send email successfully'
    }
}

/**
 * 用户名查重
 * 
 * @method Post
 */
const checkUsername = async (ctx, next) => {
    const { username } = ctx.request.body

    const user = await User_mod.findOne({
        username
    })

    ctx.body = user ? {
        code: 0,
        msg: 'Invalid username: username is existed'
    } : {
        code: 1,
        msg: 'Available username'
    }
}

/**
 * 邮箱查重
 * 
 * @method Post
 */
const checkEmail = async (ctx, next) => {
    const { email } = ctx.request.body
    const user = await User_mod.findOne({
        email
    })

    ctx.body = user ? {
        code: 0,
        msg: 'Invalid email: email is existed'
    } : {
        code: 1,
        msg: 'Available email'
    }
}

/**
 * 密码验证
 * 
 * @method Post
 */
const checkPassword = async (ctx, next) => {
    const { user_id, password } = ctx.request.body

    const result = await User_mod.findById(user_id)
    const match = await passport.validate(password, result.hash)
    ctx.body = match ? {
        code: 1,
        msg: 'Password correct',
    } : {
        code: 0,
        msg: 'Wrong password'
    }
}

/**
 * 登录
 * 
 * 1. 检验输入的用户名或邮箱
 * 2. 校验密码
 * 3. 通过后更新最后登录时间，生成并返回 token
 * @method Post
 * @param {用户名或邮箱} account
 * @param {密码} password
 */
const login = async (ctx, next) => {
    const { account, password } = ctx.request.body
    const { exp, secretKey } = config.jwt
    // 校验用户名和邮箱
    const result = await User_mod.findOne({ $or: [{username: account}, {email: account}] })
    if (!result) {
        ctx.status = 200
        return ctx.body = {
            code: 0,
            msg: 'Wrong username or email'
        }
    }
    const { _id, username, email, hash } = result

    // 校验密码
    const match = await passport.validate(password, hash)
    if (match) {
        await User_mod.updateOne({
            _id
        }, {
            last_login_at: new Date().toISOString()
        })
        const newToken = jsonwebtoken.sign({
            exp: Date.now() + exp * 1000,
        }, secretKey)
        return ctx.body = {
            code: 1,
            msg: 'Login successfully',
            data: {
                user_id: _id,
                username: username,
                email: email,
                token: newToken
            }
        }
    }

    ctx.body = {
        code: 0,
        msg: 'Wrong password'
    }
}

/**
 * 注册
 * 
 * username, email 已经通过校验
 * 
 * @method Post
 * @param {用户名} username
 * @param {邮箱} email
 * @param {验证码} captcha
 * @param {密码} password
 */
const register = async (ctx, next) => {
    const { username, email, captcha, password } = ctx.request.body

    // 插入新用户
    const hash = await passport.encrypt(password, config.bcrypt.saltTimes)
    const result = await Captcha_mod.findOne({
        email,
        captcha
    })
    if (!result || Date.now() > result.exp) {
        return ctx.body = {
            code: 0,
            msg: 'Invalid captcha'
        }
    }
    const now = new Date().toISOString()
    const newUser = await User_mod.create({
        username,
        email,
        hash,
        created_at: now,
        password_updated_at: now
    })
    if (newUser) {
        Captcha_mod.deleteOne({
            email,
            captcha
        })
    }

    ctx.body = newUser ? {
        code: 1,
        msg: 'Register successfully',
    } : {
        code: 0,
        msg: 'Register failed'
    }
}

/**
 * 更新个人信息
 * 
 * @method Post
 */
const updateProfile = async (ctx, next) => {
    const { user_id, birthYear, birthMonth, birthDay, sex, country, postalCode, timezoom } = ctx.request.body
    const { n, nModified, ok } = await User_mod.updateOne({
        _id: user_id
    }, {
        birthYear,
        birthMonth,
        birthDay,
        sex,
        country,
        postalCode,
        timezoom
    })

    ctx.body = nModified > 0 ? {
        code: 1,
        msg: 'Update info successfully'
    } : {
        code: 0,
        msg: 'Update info failed'
    }
}

/**
 * 更新用户名
 */
const updateUsername = async (ctx, next) => {
    const { user_id, username } = ctx.request.body

    const result = await User_mod.findById(user_id)
    const user = await User_mod.findOne({
        username
    })

    if (user) {
        return ctx.body = {
            code: -1,
            msg: 'Username exists'
        }
    }
    const { n, nModified, ok } = await User_mod.updateOne({
        _id: user_id
    }, {
        username
    })
    ctx.body = nModified > 0 ? {
        code: 1,
        msg: 'Update username successfully',
        data: result
    } : {
        code: 0,
        msg: 'Update username failed'
    }
}

const getProfile = async (ctx, next) => {
    const { user_id } = ctx.request.query
    const result = await User_mod.findById(user_id)
    ctx.body = result ? {
        code: 1,
        msg: 'Get profile successfully',
        data: result
    } : {
        code: 0,
        msg: 'Get info failed'
    }
}

const getAllUsername = async (ctx, next) => {
    const users = await User_mod.find()
    let username = []
    users.map(user => {
        username.push({
            user_id: user._id,
            username: user.username
        })
    })

    ctx.body = {
        code: 1,
        msg: 'Get username successfully',
        data: username
    }
}

const checkIfjoinedList = async (ctx, next) => {
    const { list_id, user_id } = ctx.request.body

    const list = await List_mod.findById(list_id)
    if (!list) {
        return ctx.body = {
            code: 0,
            msg: 'List is not existed'
        }
    }

    ctx.body = list.members.indexOf(user_id) > -1 ? {
        code: 2,
        msg: 'Member joined',
    } : {
        code: 1,
        msg: 'Member is not joined',
    }
}

/**
 * 检查共享邀请链接是否有效（对应清单是否已关闭分享）
 */
const checkInvitationToken = async (ctx, next) => {
    const { invitationToken } = ctx.request.body
    let decoded
    try {
        decoded = jsonwebtoken.verify(invitationToken, config.jwt.secretKey)
    } catch (error) {
        ctx.body = {
            code: 0,
            msg: error
        }
    }

    const list = await List_mod.findById(decoded.list_id)
    ctx.body = list.invitation_token === invitationToken ? {
        code: 1,
        msg: 'Availble InvitationToken'
    } : {
        code: 0,
        msg: 'Invalid invitationToken'
    }
}

const importFromWunderList = async (ctx) => {
    const { code, client_id, client_secret } = ctx.request.body
    try {
        const res = await axios.post('https://www.wunderlist.com/oauth/access_token', {
            code,
            client_id,
            client_secret
        })
        ctx.body = {
            code: 1,
            data: res.data.access_token
        }
    } catch (error) {
        console.log(error)
    }
}

/**
 * 修改邮箱
 */
const changeEmail = async (ctx, next) => {
    const { user_id, email, captcha } = ctx.request.body

    const result = await Captcha_mod.findOne({
        email,
        captcha
    })
    if (!result || Date.now() > result.exp) {
        return ctx.body = {
            code: 0,
            msg: 'Invalid captcha'
        }
    }
    const { nModified, n, ok } = await User_mod.updateOne({
        _id: user_id
    }, {
        email
    })
    if (nModified > 0) {
        Captcha_mod.deleteOne({
            email,
            captcha
        })
    }
    ctx.body = nModified > 0 ? {
        code: 1,
        msg: 'Change email successfully'
    } : {
        code: 0,
        msg: 'Change email failed'
    }
}

/**
 * 修改密码
 */
const changePassword = async (ctx, next) => {
    const { user_id, password } = ctx.request.body

    const hash = await passport.encrypt(password, config.bcrypt.saltTimes)
    const { nModified, n, ok } = await User_mod.updateOne({
        _id: user_id
    }, {
        hash,
        password_updated_at: new Date().toISOString()
    })
    ctx.body = nModified > 0 ? {
        code: 1,
        msg: 'Change password successfully',
    } : {
        code: 0,
        msg: 'Change password failed'
    }
}

/**
 * 忘记密码
 */
const forgetPassword = async (ctx, next) => {
    const { email, captcha, password } = ctx.request.body

    const result = await Captcha_mod.findOne({
        email,
        captcha
    })
    if (!result || Date.now() > result.exp) {
        return ctx.body = {
            code: 0,
            msg: 'Invalid captcha'
        }
    }
    const hash = await passport.encrypt(password, config.bcrypt.saltTimes)
    const { nModified, n, ok } = await User_mod.updateOne({
        email
    }, {
        hash,
        password_updated_at: new Date().toISOString()
    })
    if (nModified > 0) {
        Captcha_mod.deleteOne({
            email,
            captcha
        })
    }

    ctx.body = nModified > 0 ? {
        code: 1,
        msg: 'Change password successfully',
    } : {
        code: 0,
        msg: 'Change password failed'
    }
}

module.exports = {
    sendEmail,
    checkUsername,
    checkEmail,
    checkPassword,
    login,
    register,
    updateProfile,
    updateUsername,
    getProfile,
    getAllUsername,
    checkIfjoinedList,
    checkInvitationToken,
    importFromWunderList,
    changeEmail,
    changePassword,
    forgetPassword
}