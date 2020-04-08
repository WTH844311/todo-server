const jsonwebtoken = require('jsonwebtoken')
const config = require('../../config')
const list_mod = require('../models/list_mod')
const User_mod = require('../models/user_mod')

/**
 * 加入共享清单
 * 
 * @method Post
 * @param {用户 id} user_id 
 * @param {清单 id} list_id
 */
const joinShareList = async (ctx, next) => {
    const { user_id, list_id } = ctx.request.body

    const list = await list_mod.findById(list_id)
    list.members.push(user_id)
    const { n, nModified, ok } = await list_mod.updateOne({
        _id: list_id
    }, list)

    ctx.body = nModified > 0 ? {
        code: 1,
        msg: 'Join list successfully'
    } : {
        code: 0,
        msg: 'Join list failed'
    }
}

const openShare = async (ctx) => {
    const { list_id } = ctx.request.body
    const list = await list_mod.findById(list_id)
    const user = await User_mod.findById(list.owner_id)
    const invitation_token = jsonwebtoken.sign({
        list_id: list._id,
        list_name: list.title,
        owner_id: list.owner_id,
        owner: user.username
    }, config.jwt.secretKey)
    try {
        const { n, nModified, ok } = await list_mod.updateOne({
            _id: list._id
        }, {
            sharing_status: 'Open',
            invitation_token
        })
        ctx.body = nModified > 0 ? {
            code: 1,
            msg: 'Open share successfully',
            data: {
                invitation_token
            }
        } : {
            code: 0,
            msg: 'Open share failed'
        }
    } catch (error) {
        ctx.body = {
            code: 0,
            msg: error
        }
    }
}

module.exports = {
    joinShareList,
    openShare
}