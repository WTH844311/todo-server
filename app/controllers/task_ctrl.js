const config = require('../../config')
const func = require('../utils/upload')
const fs = require('fs')


/**
 * 获取七牛云存储数据凭证
 */
const uploadFile = async (ctx, next) => {
    try {
        const file = ctx.request.files.file
        // 创建文件可读流
        const reader = fs.createReadStream(file.path);
        // 命名文件以及拓展名
        const fileUrl = file.name;
        // 调用方法(封装在utils文件夹内)
        const result = await func.upToQiniu(reader, fileUrl);
        if (result) {
            ctx.body = {
                code: 1,
                msg: '上传成功',
                data: {
                    ...result,
                    url: `http://${config.upload.domain}/${result.key}`
                }
            }
        } else {
            ctx.body = {
                code: 0,
                msg: '上传失败',
            }
        }
    } catch (error) {
        ctx.body = {
            code: 0,
            msg: error
        }
    }
}

module.exports = {
    uploadFile,
}