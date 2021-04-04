/*
    启动聊天的服务端程序
    注意：网页版的化 跳转新页面 重新刷新 链接就会断开 （可以通过存储到数据库）
         单页面路由跳转不会断
*/ 


const app = require("express")();//引进express
const sever = require("http").Server(app);//
const io = require("socket.io")(sever);

//记录所有已经登陆过的用户
const users = []

sever.listen(3000,() => {
    console.log('启动服务成功');
})


//express处理静态资源
//这句话的意思是把 public目录设置为静态资源目录
app.use(require('express').static('public'))


app.get('/',function(req,res) {
    // res.sendFile(__dirname + '/index.html')
    //这句话的意思是重定向到首页
    res.redirect('/index.html')
})

io.on('connection', function (socket) {
    console.log('新用户链接了');
    socket.on('login', data => {
        console.log(data)
        //判断 如果data在user汇总存在，说明用户已经登陆了 不允许登陆
        //反之说明可以登陆
        let user = users.find(item => item.username === data.username)
        // console.log(user);
        if(user){
            //表示用户存在 --登陆失败 服务器给当前用户响应 告诉登陆失败
            socket.emit('loginError',{msg:'登陆失败'})
            console.log('登陆失败');
        }else{
            //表示用户不存在，登陆成功
            users.push(data)
            //告诉用户登陆成功
            socket.emit('successLogin',data) //--socket.emit只能发一个用户 （告诉当前用户）
            console.log('登陆成功');

            //告诉所有的用户 有用户加入到了聊天室，广播消息 io.emit可以告诉所有人 （告诉所有人:广播事件）
            io.emit('addUser',data)

            //告诉所有的用户，目前聊天室中有多少的人
            io.emit('userList',users)

            //把登陆成功的成功的用户名和头像存储起来
            socket.username = data.username
            socket.headImage = data.headImage
        }
    });


    // 用户断开链接的功能  （不是自定义的，是固定的）
    //监听用户断开链接 只要断开链接 就会触发disconnect事件
    socket.on('disconnect',() => {
        //把当前用户的信息从users数组中删除
        let idx = users.findIndex(item => item.username === socket.username)//找到数组中当前离开的用户在数组中的下标
        //删除断开链接的这个人
        users.splice(idx,1)
        //告诉所有人有人离开了聊天室
        io.emit('delUser',{
            username:socket.username,
            headImage:socket.headImage
        })
        //告诉所有人 userlist发生了更新
        io.emit('userList',users)//把删除之后的users数组重新发送给所有人
    })

    //监听聊天的消息
    socket.on('sendMssage',data => {
        console.log(data);
        //服务器拿到发送的消息要广播所有用户 （如果有数据库需要存起来）
        io.emit('receiveMessage',data)
    })

    //监听上传图片消息
    socket.on('sendImage',data => {
        console.log(data.img);
        //广播给所有用户
        io.emit('receiveImage',data)
    })
});
  