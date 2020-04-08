async function getISOCurrentTime(ctx, next) {
    ctx.request.body.ISOTime = new Date().toISOString()

    await next()
}

module.exports = getISOCurrentTime