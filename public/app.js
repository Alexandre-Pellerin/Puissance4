;
jQuery(function ($) {
    'use strict';


    // Tout le code en rapport avec la Socket.IO est collecté dans le var IO.
    var IO = {

        // Initialisation
        init: function () {
            IO.socket = io.connect();
            IO.bindEvents();
        },


        //Events écoutés par le client provenant du serveur
        bindEvents: function () {
            IO.socket.on('connected', IO.onConnected);
            IO.socket.on('test', IO.test);
            IO.socket.on('initGame', IO.initGame);
            IO.socket.on('actualisation', IO.actualisation);
            IO.socket.on('newGameCreated', IO.onNewGameCreated);
            IO.socket.on('playerJoinedRoom', IO.playerJoinedRoom);
            IO.socket.on('gameOver', IO.gameOver);
            IO.socket.on('error', IO.error);
            IO.socket.on('showLeader', IO.showLeader);

        },


        // Client connecté
        onConnected: function () {
            App.mySocketId = IO.socket.socket.sessionid;
        },
        test: function (data) {
            console.log(data)
        },

        // Création de la grille
        initGame: function (data) {
            console.log("init")
            App.allowToPlay = data.youstart;

            for (var i = 0; i < 6; i++)
                App.grid[i] = new Array(7);
            for (var i = 0; i < 6; i++)
                for (var j = 0; j < 7; j++) { App.grid[i][j] = 0; }

            App.displayGrid(App.grid);
            if (App.allowToPlay) {
                alert("A toi de jouer.");
            }
        },

        // Actualisation de la grille suite à un clique
        actualisation: function (data) {
            console.log("actualisation" + data.grille);
            App.allowToPlay = data.youstart;

            App.grid = data.grille;
            App.displayGrid(App.grid);
            if (App.allowToPlay) {
                alert("A toi de jouer.");
            }
        },

        // Fonction fin de partie
        gameOver: function (data) {
            console.log(data);
            App.displayGrid(App.grid);
            window.alert("Partie gagnée!");

        },


        showLeader: function (data) {
            App.$gameArea.html(App.$leaderGame);
            var table = '<div id="tablearea"><table id="leadertable"><tr><th>Player Name</th><th>Total Win</th></tr>';
            console.log("Showing Leader");
            var i = Object.keys(data).length;
            for (var j = 0; j < i; j++) {
                table += '<tr><td>' + data[j].name + '</td><td>' + data[j].win + '</td></tr>';
            }
            table += '</table></div>';
            table += "<div id='mid'><button id='back' class='btn'>BACK</button></div>"
            console.log(table);
            App.$gameArea.append(table);
        },

        onNewGameCreated: function (data) {
            App.gameInit(data);
        },

        playerJoinedRoom: function (data) {
            console.log("playerJoinedRoom");
        },

        error: function (data) {
            alert(data.message);
        }

    };

    var App = {

        gameId: 0,

        myRole: '',

        mySocketId: '',

        currentRound: 0,

        pseudo: "",

        grid: new Array(6),

        allowToPlay: false,


        // Appelée quand le jeu démarre
        init: function () {
            App.cacheElements();
            App.showInitScreen();
            App.bindEvents();

            FastClick.attach(document.body);
        },


        gameInit: function (data) {
            App.myRole = 'Host';
            App.pseudo = data.pseudo;
            App.gameId = data.gameId;
            App.playerId = data.playerId;

            App.displayNewGameScreen();

        },


        cacheElements: function () {
            App.$doc = $(document);

            // Templates
            App.$gameArea = $('#gameArea');
            App.$templateIntroScreen = $('#intro-screen-template').html();
            App.$templateNewGame = $('#create-game-template').html();
            App.$templateJoinGame = $('#join-game-template').html();
            App.$hostGame = $('#host-game-template').html();
            App.$leaderGame = $('#leaderboard-template').html();
        },


        // Evènement des "clicks" sur les boutons 
        bindEvents: function () {
            App.$doc.on('click', '#btnCreateGame', App.onCreateClick);

            App.$doc.on('click', '#btnJoinGame', App.onJoinClick);
            App.$doc.on('click', '#btnStart', App.onPlayerStartClick);
            App.$doc.on('click', '.btnAnswerJ', App.Player.onPlayerClick);
            App.$doc.on('click', '.btnAnswerR', App.Player.onPlayerClick);
            App.$doc.on('click', '.btnAnswerV', App.Player.onPlayerClick);
            App.$doc.on('click', '#btnPlayerRestart', App.Player.onPlayerRestart);
            App.$doc.on('click', '#leaderboard', App.onLeaderboardClick);
            App.$doc.on('click', '#back', App.onBackClick);
        },


        showInitScreen: function () {
            App.$gameArea.html(App.$templateIntroScreen);
            App.doTextFit('.title');
        },

        onLeaderboardClick: function () {
            console.log("clicked button");
            IO.socket.emit('findLeader');
        },

        onBackClick: function () {
            App.$gameArea.html(App.$templateIntroScreen);
            App.doTextFit('.title');
        },



        onCreateClick: function () {

            var pseudo = $('#inputPlayerName').val() || 'anon';
            let data = {
                pseudo: pseudo,
                nbplayers: 2,
                playerId: 1,
            }
            IO.socket.emit('createNewGame', data);
        },


        displayNewGameScreen: function () {
            App.$gameArea.html(App.$templateNewGame);

            $('#gameURL').text(window.location.href);
            $('#hostPlayerName').text(App.pseudo);

            $('#spanNewGameCode').text(App.gameId);
            $('#playerWaitingMessage')
                .append('<p/>')
                .text('Please wait a second player for game to begin.');
        },


        onJoinClick: function () {
            App.Player.pseudo = $('#inputPlayerName').val() || "anone";
            console.log(App.Player.pseudo);
            App.$gameArea.html(App.$templateJoinGame);
            $('#secondPlayerName').text(App.Player.pseudo);
            App.Player.playerId = 2;
        },


        onPlayerStartClick: function () {
            console.log('Player clicked "Start"');

            var data = {
                gameId: ($('#inputGameId').val()),
                pseudo: App.Player.pseudo
            };
            console.log("pseudo ", data.pseudo)
            IO.socket.emit('playerJoinGame', data);
        },


        endGame: function (data) {
        },


        restartGame: function () {
            App.$gameArea.html(App.$templateNewGame);
            $('#spanNewGameCode').text(App.gameId);
        },


        // Code du joueur
        Player: {

            pseudo: '',

            playerId: 1,


            onPlayerClick: function () {
                if (App.allowToPlay) {
                    App.allowToPlay = false;
                    var $btn = $(this);
                    var col = $btn.val();
                    console.log("Bouton cliqué : " + App.Player.playerId);
                    for (var r = 5; r >= 0; r--) {
                        if (App.grid[r][col] == 0) {
                            App.grid[r][col] = App.Player.playerId;
                            IO.socket.emit('movePlayed', App.grid);
                            break;
                        }
                    }
                    console.log(App.chkWinner(App.grid));
                    if (App.chkWinner(App.grid) != 0) {

                        IO.socket.emit('gameOver', App.gameOver);
                    }
                }
            },


            onPlayerRestart: function () {
                var data = {
                    gameId: App.gameId,
                    playerName: App.Player.myName
                }
                IO.socket.emit('playerRestart', data);
                App.currentRound = 0;
                $('#gameArea').html("<h3>Waiting on host to start new game.</h3>");
            },


            updateWaitingScreen: function (data) {
                if (IO.socket.socket.sessionid === data.mySocketId) {
                    App.myRole = 'Player';
                    App.gameId = data.gameId;

                    $('#playerWaitingMessage')
                        .append('<p/>')
                        .text('Joined Game ' + data.gameId + '. Please wait for game to begin.');
                }
            },


            gameCountdown: function (hostData) {
                $('#gameArea')
                    .html('<div class="gameOver">Get Ready!</div>');
            },


            newWord: function (data) {
                var $list = $('<ul/>').attr('id', 'ulAnswers');

                $.each(data.list, function () {
                    $list
                        .append($('<li/>')
                            .append($('<button/>')
                                .addClass('btnAnswer')
                                .addClass('btn')
                                .val(this)
                                .html(this)
                            )
                        )
                });

                $('#gameArea').html($list);
            },


            endGame: function () {
                $('#gameArea')
                    .html('<div class="gameOver">Game Over!</div>')
                    .append(
                    $('<button>Start Again</button>')
                        .attr('id', 'btnPlayerRestart')
                        .addClass('btn')
                        .addClass('btnGameOver')
                    );
            }
        },

        displayGrid: function (grid) {
            var $tab = $('<table/>');
            for (var i = 0; i < 6; i++) {
                var $li = $('<tr/>');
                for (var j = 0; j < 7; j++) {
                    if (grid[i][j] == 1) {
                        $li
                            .append($('<td/>')
                                .append($('<button/>')
                                    .addClass('btnAnswerR')
                                    .val(j)
                                )
                            )
                    } else if (grid[i][j] == 2) {
                        $li
                            .append($('<td/>')
                                .append($('<button/>')
                                    .addClass('btnAnswerJ')
                                    .val(j)
                                )
                            )
                    }
                    else {
                        $li
                            .append($('<td/>')
                                .append($('<button/>')
                                    .addClass('btnAnswerV')
                                    .val(j)
                                )
                            )
                    }

                }
                $tab.append($li);
            }

            $('#gameArea').html($tab);
        },



        countDown: function ($el, startTime, callback) {

            $el.text(startTime);
            App.doTextFit('#hostWord');

            var timer = setInterval(countItDown, 1000);

            function countItDown() {
                startTime -= 1
                $el.text(startTime);
                App.doTextFit('#hostWord');

                if (startTime <= 0) {
                    clearInterval(timer);
                    callback();
                    return;
                }
            }

        },


        doTextFit: function (el) {
            textFit(
                $(el)[0],
                {
                    alignHoriz: true,
                    alignVert: false,
                    widthOnly: true,
                    reProcess: true,
                    maxFontSize: 300
                }
            );
        },

        chkLine: function (a, b, c, d) {
            return ((a != 0) && (a == b) && (a == c) && (a == d));
        },

        chkWinner: function (grid) {
            // Check down
            for (var r = 0; r < 3; r++)
                for (var c = 0; c < 7; c++)
                    if (App.chkLine(grid[r][c], grid[r + 1][c], grid[r + 2][c], grid[r + 3][c]))
                        return grid[r][c];

            // Check right
            for (r = 0; r < 6; r++)
                for (c = 0; c < 4; c++)
                    if (App.chkLine(grid[r][c], grid[r][c + 1], grid[r][c + 2], grid[r][c + 3]))
                        return grid[r][c];

            // Check down-right
            for (r = 0; r < 3; r++)
                for (c = 0; c < 4; c++)
                    if (App.chkLine(grid[r][c], grid[r + 1][c + 1], grid[r + 2][c + 2], grid[r + 3][c + 3]))
                        return grid[r][c];

            // Check down-left
            for (r = 3; r < 6; r++)
                for (c = 0; c < 4; c++)
                    if (App.chkLine(grid[r][c], grid[r - 1][c + 1], grid[r - 2][c + 2], grid[r - 3][c + 3]))
                        return grid[r][c];

            return 0;
        }


    };

    IO.init();
    App.init();

}($));

