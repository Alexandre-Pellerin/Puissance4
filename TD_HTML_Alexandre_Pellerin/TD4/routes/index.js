var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET Hello World page. */
router.get('/helloworld', function(req, res) {
  res.render('helloworld', { title: 'Hello, World!' })
});

/* GET Userlist page. */
router.get('/userlist', function(req, res) {
  var db = req.db;
  var collection = db.get('usercollection');
  collection.find({},{},function(e,docs){
      res.render('userlist', {
          "userlist" : docs
      });
  });
});

/* GET page pour un Nouvel utilisateur. */
router.get('/newuser', function(req, res) {
  res.render('newuser', { title: 'Add New User' });
});

 /* POST pour ajouter un utilisateur */
 router.post('/adduser', function(req, res) {
  
      // On positionne la variable db sur la base de données
      var db = req.db;
  
      // On récupère les données du formulaire
      var userName = req.body.username;
      var userEmail = req.body.useremail;
  
      // On récupère la collection
      var collection = db.get('usercollection');
  
    // On insère les données dans la base
      collection.insert({
          "username" : userName,
          "email" : userEmail
      }, function (err, doc) {
          if (err) {
              // En cas de problème, on renvoie une erreur
              res.send("Il y a un problème pour insérer les données dans la base.");
          }
          else {
              // En cas de succès on revient sur la page /userlist
              res.location("userlist");
              res.redirect("userlist");
          }
      });
  });

module.exports = router;
