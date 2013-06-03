YUI().use('*', function (Y) {

/* Initialization */
    var socket = io.connect('http://localhost:6969');
    var id;
    Y.one('#panel-file').hide();
    Y.one('#nickname-input').on('key', function () {
        Y.one('#panel-nickname .ok').simulate('click');  //press Enter to send nickname
    }, 'enter');




/* Event register */
    Y.one('#panel-nickname .ok').on('click', function (e) {
        var s = Y.one('#nickname-input').get('value');
        if (s === '') {
            e.preventDefault();
            Y.one('#panel-nickname .panel-body').addClass('em');  //notify the required field of nickname
        } else {
            e.preventDefault();
            Y.one('#panel-nickname').hide();
            Y.one('#mask').hide();
            socket.emit('register-nickname', s);
        }
    });

    Y.one('#panel-file .ok').on('click', function (e) {
        var f = document.getElementById('choose-file').files[0];
        var reader = new FileReader;
        reader.onload = (function (f) {
            return function (e) {
                socket.emit('send-file', {
                    name: f.name,
                    type: f.type,
                    content: e.target.result  //base64 encoded
                });
                Y.one('#panel-file').hide();
                Y.one('#mask').hide();
            };
        }(f));  //use a closure to save file.name and file.type
        reader.readAsDataURL(f);  //base64
    });

    Y.one('#panel-file .cancel').on('click', function (e) {
        e.preventDefault();
        Y.one('#panel-file').hide();
        Y.one('#mask').hide();
    });

    Y.one('#send-file').on('click', function (e) {
        e.preventDefault();
        Y.one('#panel-file').show();
        Y.one('#mask').show();
    });

    Y.one('#input-msg-send').on('click', function (e) {
        e.preventDefault();
        var l = Y.one('#input-msg');
        var msg = Y.Lang.trim(l.get('value'));  //trim spaces and newlines
        if (msg !== '') {
            l.set('value', '');
            socket.emit('client-send', msg);
        }
    });
    Y.on('key', function (e) {  //Ctrl+Enter to send a message
        e.preventDefault();
        var l = Y.one('#input-msg');
        Y.one('#input-msg-send').simulate('click');
    }, '#input-msg', 'enter+ctrl');




/* Socket Event Register */
    socket.on('hello', function (d) {
        id = d.id;
        console.log(id);
    });

    socket.on('online-update', function (m) {
        var template = '<li><span title="{id}">{nickname}</span></li>';
        Y.one('#online-list').empty();
        Y.Object.each(m, function (value, index) {
            Y.one('#online-list').append(Y.Lang.sub(template, {nickname: value, id: index}));
        });
    });

    socket.on('server-ack', function (m) {
        /*if (m.id === id) {
            m.id = 'me';
        }*/
        m.time = (new Date(m.time)).toString();  //m.time is in millisecond, make a conversion here
        var template = '<dt><span title="{id}">{nickname}</span> @ {time}</dt><dd>{msg}<dd>';
        Y.one('#message-col').append(Y.Lang.sub(template, m));
    });

    socket.on('message', function (m) {
        Y.one('#message-col').append('<p>' + m + '</p>');
    });

    socket.on('msg-file', function (m) {
        var template = '<p>{user} uploads a file: <a href="{href}" target="_blank">{name}</a></p>';
        Y.one('#message-col').append(Y.Lang.sub(template, m));
    });
});
