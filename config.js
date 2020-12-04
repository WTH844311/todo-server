module.exports = {
    port: 3001,   // 项目启动的端口
    wsPort: 3002, // WebSocket 端口
    domain: 'localhost',
    db: 'mongodb://localhost:27017/todo',
    bcrypt: {
        saltTimes: 3, // 加盐的次数（用户密码加密）
    },
    jwt: {
        // 生成的 token 有效时间为 24 小时
        exp: 24 * 60 * 60,
        // 使用你自己的密钥，用来根据密钥生成 token
        secretKey: 'WTH30haha'
    },
    // 文件上传用到了七牛云的对象存储服务，详情访问官网 https://developer.qiniu.com/kodo/sdk/1289/nodejs
    upload: {
        // 下面的参数必须声明
        domain: 'ms.reddme.com',
        bucket: 'ms-todo',
        accessKey: 'wC1ggwXnmOjrYH_KafOUHMjNocGMw2UmkHUJrBgB',
        secretKey: 'L99sb4g33VADVtoC-gLqbN_0gqr0c-9PPxm8jPyT'
    },
    // 你的发件邮箱服务器配置
    email: {
        host: '',
        port: 465,  // 25 端口在阿里云服务器被封禁
        auth: {
            user: '', // 邮箱账号
            pass: ''  // 邮箱授权码
        }
    }
}
