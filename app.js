var express = require("express");
var port = 3700;

var color = require("colors");

var path = require('path');

var S = require('string');

var app = express();
app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname + '/public/index.html'));
});


function Game(thisGameId, socketId, pseudo, id, nbplayers) {
    console.log("socketId " + socketId)
    this.gameid = thisGameId;
    this.players = [
        new Player(socketId, pseudo, id)
    ];
    this.nbplayers = nbplayers;
    this.whoplay = 0;
}

class Player {
    constructor(socketIdPlayer, pseudo, playerId) {
        this.socketId = socketIdPlayer;
        this.pseudo = pseudo;
        this.playerId = playerId;
    }
}

//variables de jeu
var listGames = [];
var listPlayers = [];


app.use(express.static(__dirname + '/public'));
var io = require('socket.io').listen(app.listen(port));

io.sockets.on('connection', function (socket) {

    socket.on('createNewGame', playerCreateNewGame);
    socket.on('playerJoinGame', playerJoinGame);
    socket.on('movePlayed', movePlayed);
    socket.on('gameOver', gameOver);

    socket.on('disconnect', function () {
        socket.emit('disconnected');
    });


    function playerCreateNewGame(data) {
        console.log("player creat " + socket.id + " pseudo " + data.pseudo);

        let thisGameId = (Math.random() * 100000) | 0;
        console.log("this : ");
        listGames.push(
            new Game(thisGameId, socket.id, data.pseudo, 1, data.nbplayers)
        );
        console.log("testtest" + listGames[0]['players'][0]['socketId'])
        
        socket.emit('newGameCreated', { gameId: thisGameId, mySocketId: socket.id, pseudo: data.pseudo, playerId: data.playerId });

        socket.join(thisGameId.toString());
    };

    function playerJoinGame(data) {

        let gamefound = false

        listGames.forEach(game => {
            if (S(data.gameId).s == game['gameid']) {
                gamefound = true;
                console.log("new plyers " + data.pseudo);
                if (game.nbplayers > Object.keys(game['players']).length) {
                    game['players'].push(
                        new Player(socket.id, data.pseudo, data.playerId =  Object.keys(game['players']).length+1)
                    )
                    socket.emit('test', game['players']);
                    if (game.nbplayers == Object.keys(game['players']).length) {
                        console.log("test ok");
                        initfunction(socket, game);
                    }
                }
                else {
                    socket.emit('error', { message: "party full" });
                }
            }
        });

        if (gamefound == false) {
            socket.emit('error', { message: "This room does not exist." });
        }
    }
    function movePlayed(data) {
        listGames.forEach(game => {
            game['players'].forEach(player => {
                if (socket.id == player['socketId']) {
                    console.log(data);
                    console.log("actualisation called");
                    actualisationfunction(socket, game, data)
                }
            });
        });
    }
    function gameOver(data) {
        listGames.forEach(game => {
            game['players'].forEach(player => {
                if (socket.id == player['socketId']) {
                    gameOverfunction(socket, game, data, player['pseudo'])
                }
            });
        });
    }

});


// Fonction du serveur gérant l'initialisation de la grille et choisit qui joue en premier
function initfunction(socket, game) {
    //tirage au sort du premier à jouer
    var whoStart = 1;
    console.log("whostart : " + whoStart);
    game['whoplay'] = whoStart;
    if (socket.id == game['players'][whoStart]['socketId']) {
        socket.emit('initGame', { youstart: true, color: game['whoplay'], etape: 1 })
        for (var i = 0; i < game.nbplayers; i++) {
            socket.to(game['players'][i]['socketId']).emit('initGame', { youstart: false, color: i });
        }
    }
    else {
        socket.emit('initGame', { youstart: false, color: 0, etape: 2 });
        for (var i = 0; i < game.nbplayers; i++) {
            if (i != game['whoplay'])
                socket.to(game['players'][i]['socketId']).emit('initGame', { youstart: false, color: i });
            else
                socket.to(game['players'][i]['socketId']).emit('initGame', { youstart: true, color: i });
        }

    }
}


// Fonction du serveur gérant l'actualisation de la grille lorsqu'un joueur à joué
function actualisationfunction(socket, game, data) {
    console.log(data);
    socket.emit('actualisation', { youstart: false, color: game['whoplay'], grille: data })
    for (var i = 0; i < game.nbplayers; i++) {
        socket.to(game['players'][i]['socketId']).emit('actualisation', { youstart: true, color: 1, grille: data });
    }
}


// Fonction du serveur gérant la fin de partie 
function gameOverfunction(socket, game, data, name) {
    var whoStart = 1;
    socket.emit('gameOver', { grille: data, pseudo: name });
    for (var i = 0; i < game.nbplayers; i++) {
        socket.to(game['players'][whoStart]['socketId']).emit('gameOver', { grille: data, pseudo: name });
    }
}

