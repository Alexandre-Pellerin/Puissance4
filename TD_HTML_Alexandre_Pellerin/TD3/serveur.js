var http = require('http');
var swig = require('swig');
var url = require('url');


// Nouvelle fonction permettant de supprimer un élément dans un tableau
Array.prototype.unset = function(val){
    var index = this.indexOf(val)
      if(index > -1){
        this.splice(index,1)
      }
    }

var myUsers = new Array; //variable globale qui contiendra l'ensemble des utilisateurs

httpServer = http.createServer(function(req,res) {
    var page = url.parse(req.url).pathname;
    if (page    === '/') {
        res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(swig.renderFile('index.html')
            );
    } else {
        res.writeHead(404, {'Content-Type': 'text/html'});
        res.write('<h1>Error 404 : page not found</h1>');
    }
    res.end();
});


var io = require('socket.io').listen(httpServer);

io.sockets.on('connection',function(socket) {
    var me; //variable globale au contexte io.sockets.on()
    console.log('Nouveau utilisateur');

    for(var i=0 ; i < myUsers.length ; i++ ){
        socket.emit('newusr',myUsers[i]);  //on envoie au nouvel utilisateur l'ensemble des users déjà connectés
      }
  
    socket.on('login',function(user){
        me=user;
        me.id = user.mail.replace('@','-').replace('.','-');
        console.log(user);
        socket.emit('logged');
        myUsers.push(me);  //on ajoute en fin de tableau le nouvel utilisateur
        io.sockets.emit('newusr',me);
    })

    socket.on('newmsg', function(message){
        message.user = me; //on va ajouter le nom de l'user au message
        date = new Date(); //on va ajouter l'heure du message
        message.h = date.getHours();  //heure
        message.m = date.getMinutes(); //minutes
        io.sockets.emit('newmsg',message); //on emet un message 'newmsg' à destination des clients
    });

    //on détecte une déconnexion
    socket.on('disconnect', function(){
    if(!me){
        return false;
    }
    myUsers.unset(me); //on supprime l'utilisateur du tableau
    io.sockets.emit('disusr',me); //on émet le signal disusr au client pour qu'il puisse enlever l'utilisateur de la liste
    });
});

httpServer.listen(8080);