/*
  聊天室的主要功能
*/
/*
  1、链接socket服务
*/
var socket = io('http://localhost:3000')
var username, headImage;//存储登陆成功的头像 和 用户名
/*
  2、登陆功能
*/
//2-1、选择头像功能
console.log($('#login_avatar li'))
$('#login_avatar li').on('click',function(){
  console.log($(this))
  $(this).addClass('now').siblings().removeClass('now')
})

//2-2、点击按钮 把选择的图片和名字发送给后台
$('#loginBtn').on('click',function(){
  //获取用户名
  var username = $('#username').val().trim()
  console.log(username,'******')
  if(!username){
    alert('请输入用户名')
    return
  } 
  //获取选择的头像 里面图片的src属性
  var headImage = $('#login_avatar li.now img').attr('src')
  console.log(username,headImage);

  //需要告诉socketio服务，登陆
  socket.emit('login',{
    username,
    headImage
  })
})

//监听登陆失败的请求
socket.on('loginError',data => {
  alert(data.msg)
})

//监听登陆成功的请求
socket.on('successLogin',data => {
  // alert('登陆成功')
  //需要隐藏登陆窗口
  $('.login_box').fadeOut()
  //显示聊天窗口
  $('.container').fadeIn()
  //设置个人信息
  $('.avatar_url').attr('src',data.headImage)//头像
  $('.username').text(data.username)//用户名
  username = data.username;//保存到全局
  headImage = data.headImage
})

//监听添加用户的消息
socket.on('addUser',data => {
  //添加一条系统消息
  $('.box-bd').append(`
   <div class="system">
      <p class="message_system">
        <span class="content">${data.username}加入了群聊</span>
      </p>
    </div>
  `)
  scrollIntoView()
})

//监听离开用户的消息
socket.on('delUser',data => {
  //添加一条系统消息
  $('.box-bd').append(`
   <div class="system">
      <p class="message_system">
        <span class="content leave">${data.username}离开了群聊</span>
      </p>
    </div>
  `)
  scrollIntoView()
})

//监听用户列表的消息
socket.on('userList',data => {
  //因为每次都会把之前的内容继续追加 会导致最前面的用户 内容重复 需要在这里每一次接受列表信息时都重置为空
  // 注意：如果是div.contenteditable 取得内容的化就需要使用html()  不能使用val()
  $('.user-list ul').html('')
  data.forEach(item => {
    $('.user-list ul').append(`
    <li class="user">
      <div class="avatar"><img src="${item.headImage}" alt=""></div>
      <div class="name">${item.username}</div>
     </li>
    `)
  });

  //群聊人数
  $('#userCount').text(data.length)
})


//聊天功能
$('.btn-send').on('click',() => {
  //获取聊天的内容
  var content = $('#content').html()
  console.log(content,'******')
  if(!content){
    alert('请输入内容')
    return
  } 
  $('#content').html('')//拿到内容之后 把输入区域清除
  //发给服务器
  socket.emit('sendMssage',{
    content,
    username,
    headImage
  })

})

//监听聊天的消息 服务器接受每一用户的消息 广播给全局的消息
socket.on('receiveMessage',data => {
  console.log(data);
  //判断该校消息是自己发出还是他人发出
  let isMe = username === data.username
  if(isMe){
    //说明是自己发出的消息 需要放在右侧
    $('.box-bd').append(`
    <div class="message-box">
      <div class="my message">
        <img src="${headImage}" alt="" class="avatar">
        <div class="content">
          <div class="bubble">
            <div class="bubble_cont">${data.content}</div>
          </div>
        </div>
      </div>
    </div>
    `)
  }else{
    //说明是别人发的消息
    $('.box-bd').append(`
    <div class="message-box">
          <div class="other message">
            <img src="${data.headImage}" alt="" class="avatar">
            <div class="nickname">${data.username}</div>
            <div class="content">
              <div class="bubble">
                <div class="bubble_cont">${data.content}</div>
              </div>
            </div>
          </div>
        </div>
    `)
    scrollIntoView()
    
  }
})
function scrollIntoView(){
  //获取最后一个dom滚动到可视区 false：当前元素底部对齐可视区域 true：顶部
  $('.box-bd')
  .children(':last')
  .get(0)
  .scrollIntoView(false)
}


//发送图片功能
$('#file').on('change',function(){
  var file = this.files[0];
  //需要把这个文件发送到服务器，拿到图片借h5新增的fileReader
  var reader = new FileReader();
  reader.readAsDataURL(file)//把上面文件读取成base64编码
  reader.onload = function(){
    //读取成功之后
    // console.log(reader.result);//这是读出来的结果
    //发给socket服务器
    socket.emit('sendImage',{
      username,
      headImage,
      img:reader.result
    })
  }

})

//监听图片聊天信息
socket.on('receiveImage',data => {
  console.log(data.username);
  console.log(data.headImage);
  //判断是自己还是别人的
  let isMe = username === data.username
  if(isMe){
    //说明是自己发出的消息 需要放在右侧
    $('.box-bd').append(`
    <div class="message-box">
      <div class="my message">
        <img src="${headImage}" alt="" class="avatar">
        <div class="content">
          <div class="bubble">
            <div class="bubble_cont">
              <img src="${data.img}" alt="" calss="">
            </div>  
          </div>
        </div>
      </div>
    </div>
    `)
  }else{
    //说明是别人发的消息
    $('.box-bd').append(`
    <div class="message-box">
          <div class="other message">
            <img src="${data.headImage}" alt="" class="avatar">
            <div class="nickname">${data.username}</div>
            <div class="content">
              <div class="bubble">
                <div class="bubble_cont">
                  <img src="${data.img}" alt="" calss="">
                </div>
              </div>
            </div>
          </div>
        </div>
    `)

    //等待图片加载完成
    $('.box-bd img:last').on('load',function(){
      scrollIntoView()
    })
    
  }
})
//点击表情按钮的时候初始化这个
$('.face').on('click',() => {

  //注意：如果使用的是textarea 是显示不出来表情 只能显示对应的代码（所以这个时候用div加contenteditable属性就可以）


  //初始化jquery-emoji插件
  $('#content').emoji({
    button:'.face',//触发表情的按钮
    showTab: false,//只有一组表情时是否显示底部tab栏
    // animation: 'slide',
    position: 'topRight',//位置左上角
    //设置多组表情
    icons: [
      {
        name: "QQ表情",
        path: "../lib/jquery-emoji/img/qq/",
        maxNum: 91,//能够显示表情的最大数量
        excludeNums: [41, 45, 54],//排除的数量
        file: ".gif"
    }]
  })
})
