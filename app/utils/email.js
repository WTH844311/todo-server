const nodemailer = require('nodemailer')
const { email } = require('../../config')

const transporter = nodemailer.createTransport(email)

module.exports = transporter