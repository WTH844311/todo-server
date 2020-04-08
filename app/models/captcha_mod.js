const mongoose = require('mongoose')

const Schema = mongoose.Schema
const CaptchaSchema = new Schema({
    email: String,
    captcha: String,
    exp: Number
}, { collection: 'captcha', versionKey: false })

module.exports = mongoose.model('captcha', CaptchaSchema)