var http = require('http')
   ,fs = require('fs')
   ,io = require('socket.io').listen(6969, {log: false})
   ,onlinelist = {}  //onlinelist[Socket ID] = Nickname
   ,fileType = [];  //save MIME-Type of files

/*Socket.io
 *port: 6969
 */
io.sockets.on('connection', function (socket) {
    socket.emit('hello', {id: socket.id});
    socket.on('register-nickname', function (m) {
        onlinelist[socket.id] = m;  //register socket ID
        io.sockets.emit('online-update', onlinelist);
        io.sockets.emit('message', onlinelist[socket.id] + ' joins the group talk.');
    });
    socket.on('client-send', function (m) {
        //who? when? what?
        io.sockets.emit('server-ack', {msg: m, id: socket.id, time: (new Date).getTime(), nickname: onlinelist[socket.id]});
    });
    socket.on('disconnect', function () {
        var name = onlinelist[socket.id];
        !name || io.sockets.emit('message', name + ' leaves the group talk.');
        delete onlinelist[socket.id];
        io.sockets.emit('online-update', onlinelist);
    });
    socket.on('send-file', function (m) {
        var index = m.content.lastIndexOf('base64,')
           ,data = m.content.slice(index + 7)  //'base64,'.length === 7
           ,buffer = new Buffer(data, 'base64')
           ,id = uniqueIDGen();
        fs.writeFileSync('./upload/' + id, buffer);  //example: ./upload/1
        fileType[id] = m.type;
        io.sockets.emit('msg-file', {user: onlinelist[socket.id]
                                     ,name: m.name
                                     ,href: 'http://127.0.0.1:6970/uploadseed' + id + '/' + m.name});  //example: uploadseed1/file.name
        //better to use inverse proxy on server, map 127.0.0.1:80/client/upload/ to 127.0.0.1:6970. A relative path would be easier
    });
});


/*File Server
 *port: 6970
 */
http.createServer(function (req, res) {  //request and response
    var reqUrl = req.url;  //full request URL
    var matched = reqUrl.match(/uploadseed(\d+)/);  //parse the file ID
    if (matched === null) {  //a false URL
        res.writeHead(403);
        res.end();
    } else {
        var id = matched[1];
        var fileName = './upload/' + id;
        fs.exists(fileName, function (exists) {
            if (exists) {
                var fileStream = fs.createReadStream(fileName);
                res.writeHead(200, {'Content-Type': fileType[id]});
                fileStream.pipe(res);
                fileStream.on('end', function () {
                    res.end();
                });
            } else {
                res.writeHead(403);
                res.end();
            }
        });
    }
}).listen(6970);

/*Utility functions
 *
 */
var uniqueIDGen = (function () {
    var id = 0;
    return function () {
        id += 1;
        return id;
    };
}());
