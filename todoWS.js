const WebSocket = require('ws');
const mongoose = require('mongoose')
const { wsPort, db } = require('./config')
const list_mod = require('./app/models/list_mod')
const task_mod = require('./app/models/task_mod')

let wss = new WebSocket.Server({ port: wsPort })
let reconnect_lock = false
	userData = []

mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }, err => {
    err ? console.error('Failed to connect to database') : console.log('Connecting database successfully')
})

wss.on('connection', (ws, req) => {
	// ws.id = Date.now()
	ws.isAlive = true
	ws.on('message', msg => {
		onReceiveMessage(msg, ws)
	})
	ws.on('pong', heartbeat)
});

console.log(`ws server started at port ${wsPort}...`)

function heartbeat() {
	this.isAlive = true
}

/**
 * 轮询数据库，将数据推送到用户端
 */
setInterval(() => {
	terminalDeadWs()
	// updateUserData()
	// broadcast()
}, 3000);

// 对方发来消息
const onReceiveMessage = async (raw, ws) => {
	let json;
	try {
		json = JSON.parse(raw);
	} catch(e){
		json = {};
	}

	console.log(json)
	switch (json.type) {
		case 'ping':
			ws.send(JSON.stringify({ type: 'pong' }))
			break
		case 'identity':
			ws.id = json.data.id
			ws.user_id = json.data.user_id
			break
		case 'fetch':
			// 客户端获取全部数据
			let lists = await list_mod.find({
				$or: [{
					owner_id: json.data
				}, {
					members: json.data
				}]
			})
			let tasks = await task_mod.find({ $or: [{
				list_id: '000000000000000000000000',
				created_by: json.data
			}, ...lists.map(list => {
				return {
					list_id: list._id
				}})]
			})
			ws.send(JSON.stringify({
				type: 'fetchSuccess',
				data: {
					lists,
					tasks
				}
			}))
			break
		case 'update':
			json.data.sort((a, b) => a.time - b.time).map(async change => {
				const selected_mod = change.target_type === 'list' ? list_mod : task_mod
				let result = null, list = null
				switch (change.change_type) {
					case 'add':
						try {
							if (typeof change.target === 'string') change.target = JSON.parse(change.target)
							result = await selected_mod.create(change.target)
							if (change.target_type === 'task') {
								list = await list_mod.findById(change.target.list_id)
								if (list !== null) {
									if (!mongoose.Types.ObjectId(ws.user_id).equals(mongoose.Types.ObjectId(list.owner_id))) {
										broadcastByAccount(list.owner_id, change)
									}
									if (list.sharing_status !== 'NotShare') {
										broadcastToShareMembers(ws, list.members, change)
									}
								}
								broadcastToSameAccount(ws, change)
							}
						} catch (error) {
							console.log('change-type: add, error: ' + error)
						}
						break
					case 'update':
						try {
							if (typeof change.target === 'string') change.target = JSON.parse(change.target)
							if (change.target_type === 'list') {
								list = change.target
							} else {
								list = await list_mod.findById(change.target.list_id)
							}
							result = await selected_mod.updateOne({
								_id: change.target._id
							}, change.target)
							if (list !== null) {
								if (list.sharing_status !== 'NotShare') {
									broadcastToShareMembers(ws, list.members, change)
								}
								if (!mongoose.Types.ObjectId(ws.user_id).equals(mongoose.Types.ObjectId(list.owner_id))) {
									broadcastByAccount(list.owner_id, change)
								}
							}
							broadcastToSameAccount(ws, change)
						} catch (error) {
							console.log('change-type: update, error: ' + error)
						}
						break
					case 'delete':
						try {
							if (change.target_type === 'list') {
								list = await list_mod.findById(change.target)
							} else {
								const task = await task_mod.findById(change.target)
								list = await list_mod.findById(task.list_id)
							}
							result = await selected_mod.deleteOne({
								_id: change.target
							})
							if (list !== null) {
								if (list.sharing_status !== 'NotShare') {
									broadcastToShareMembers(ws, list.members, change)
								}
								if (!mongoose.Types.ObjectId(ws.user_id).equals(mongoose.Types.ObjectId(list.owner_id))) {
									broadcastByAccount(list.owner_id, change)
								}
							}
							broadcastToSameAccount(ws, change)
						} catch (error) {
							console.log('change-type: delete, error: ' + error)
						}
						break
					case 'join':
						try {
							// 新成员已通过 ajax 请求加入清单，这里只执行同步
							// 新成员加入，通知该成员的其他客户端以及该清单其他成员与清单主人的所有客户端
							list = await list_mod.findById(change.target)
							change.change_type = 'update'
							change.target = list
							broadcastToShareMembers(ws, list.members, change)
							broadcastToSameAccount(ws, change)
							broadcastByAccount(list.owner_id, change)
						} catch (error) {
							console.log('change-type: join, error: ' + error)
						}
						break
					case 'removeMember':
						try {
							if (typeof change.target === 'string') change.target = JSON.parse(change.target)
							// 成员被移出，通知给除下达命令的客户端之外的包括被移出成员在内所有客户端
							list = await list_mod.findById(change.target._id)
							result = await list_mod.updateOne({
								_id: change.target._id
							}, change.target)
							const removeMemberId = list.members.find(member => change.target.members.indexOf(member) === -1)
							if (result !== null) {
								list = await list_mod.findById(change.target._id)
								broadcastToShareMembers(ws, list.members, change)
							}
							broadcastToSameAccount(ws, change)
							broadcastByAccount(removeMemberId, {
								change_type: 'delete',
								target_type: 'list',
								target: change.target._id
							})
						} catch (error) {
							console.log('change-type: removeMember, error: ' + error)
						}
						break
					case 'closeShare':
						try {
							if (typeof change.target === 'string') change.target = JSON.parse(change.target)
							// 清单关闭共享，通知所有原成员的客户端以及命令下达人的其他客户端
							list = await list_mod.findById(change.target._id)
							result = await list_mod.updateOne({
								_id: change.target._id
							}, change.target)
							broadcastToShareMembers(ws, list.members, {
								change_type: 'delete',
								target_type: 'list',
								target: change.target._id
							})
							broadcastToSameAccount(ws, change)
						} catch (error) {
							console.log('change-type: closeShare, error: ' + error)
						}
				}
				ws.send(JSON.stringify({
					type: 'updateSuccess',
					data: change.time
				}))
			})
			break
		default:
	}
}

const broadcastByAccount = async (user_id, change) => {
	for (let ws of wss.clients) {
		if (mongoose.Types.ObjectId(ws.user_id).equals(mongoose.Types.ObjectId(user_id))) {
			const msg = {
				type: 'update',
				data: change
			}
			ws.send(JSON.stringify(msg))
		}
	}
}

/**
 * 向清单的其他成员的所有客户端进行广播
 */
const broadcastToShareMembers = async (client, members, change) => {
	for (let ws of wss.clients) {
		members.map(member => {
			if (mongoose.Types.ObjectId(ws.user_id).toHexString() === member && !mongoose.Types.ObjectId(ws.user_id).equals(mongoose.Types.ObjectId(client.user_id))) {
				const msg = {
					type: 'update',
					data: change
				}
				ws.send(JSON.stringify(msg))
			}
		})
	}
}

/**
 * 向同一账号的不同客户端进行广播
 */
const broadcastToSameAccount = async (client, change) => {
	for (let ws of wss.clients) {
		if (ws.id !== client.id && mongoose.Types.ObjectId(ws.user_id).equals(mongoose.Types.ObjectId(client.user_id))) {
			const msg = {
				type: 'update',
				data: change
			}
			ws.send(JSON.stringify(msg))
		}
	}
}

// 终止不在线连接
const terminalDeadWs = () => {
	wss.clients.forEach(ws => {
		if (!ws.isAlive) return ws.terminate()
		ws.isAlive = false
		ws.ping(() => {})
	})
}