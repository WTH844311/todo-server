const User_mod = require('../models/user_mod')
const jsonwebtoken = require('jsonwebtoken')
const { jwt } = require('../../config')

/**
 * 1. 拦截已规定的未传递 token 的请求
 * 2. 检测密码被修改后的登录状态
 */
async function vertify(ctx, next) {
    const url = ctx.request.url
    console.log(url)
    // 部分接口不用检查
    switch (url) {
        case '/user/login':
        case '/user/register':
        case '/user/vertify/email':
        case '/user/vertify/username':
        case '/user/vertify/invitationToken':
        case '/user/sendEmail':
        case '/user/reset/password':
            await next()
            break
        default:
            // 1
            // 规定 token 写在 header 上的 'authorization'
            const token = ctx.request.headers['authorization']
            if (!token) {
                return ctx.body = {
                    code: -1,
                    msg: 'Token missed'
                }
            }
            // 解码
            try {
                const decoded = jsonwebtoken.verify(token, jwt.secretKey)
                if (Date.now() > decoded.exp) {
                    // token 过期
                    return ctx.body = {
                        code: -1,
                        msg: 'Token expired'
                    }
                }
            } catch(err) {
                return ctx.body = {
                    code: -1,
                    msg: JSON.stringify(err)
                }
            }
            
            // 2
            const urlList = [
                '/user/profile',
                '/user/list',
                '/task/uploadFile',
            ]
            let user_id
            if (urlList.includes(url.substring(0, url.indexOf('?')))) {
                user_id = ctx.request.query.user_id
            } else {
                user_id = ctx.request.body.user_id
            }
            const { last_login_at, password_updated_at } = await User_mod.findById(user_id)
            if (new Date(password_updated_at).getTime() > new Date(last_login_at).getTime()) {
                // 密码修改后未重新登录
                return ctx.body = {
                    code: -2,
                    msg: 'Password has already changed, please login again'
                }
            }
            await next()
    }
}

module.exports = vertify