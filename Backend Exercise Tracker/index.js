const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
mongoose = require('mongoose');
//Start creating Schemas
const {schema} = mongoose;
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
//exersice schema
const exerciseSchema = new mongoose.Schema({
  username: {
    type: String
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  _id: {
    type: String
  }
});
let Exercise = mongoose.model('Exercise', exerciseSchema);

//user schema
const userSchema = new mongoose.Schema({
  username: {
    type: String
  },
  _id: {
    type: String
  }
});
let User = mongoose.model('User', userSchema);

//log schema
const logSchema = new mongoose.Schema({
   username: {
    type: String
  },
  count: {
    type: Number
  },
  _id: {
    type: String
  },
  log: [{
    description: {
      type: String
    },
    duration: {
      type: Number
    },
    date: {
      type: String
    }
  }]
});
let Log = mongoose.model('Log', logSchema);
//Finish creating Schemas

//create and run bodyParser
let bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));


app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// POST to /api/users 
app.post('/api/users', function(req, res){
  var user1 = req.body;
    console.log('req.body: ' + JSON.stringify(user1));
  //get username
  const user = req.body.username;
  let newUsername;
  //if username is not null
  if(user !== ""){
    //create Id
    let userId = ""+(new Date().getTime() * Math.random() * 100000);
    //create new user
    let newUser = new User({
      username: user,
      _id: userId
    });
  //save user in database
  newUser.save();
  res.json({
    username: user,
    _id: userId
  });
  }
});

//GET to /api/users
app.get('/api/users', function(req, res){
  //Get all users
  User.find({}, function(err, users) {
    //create array to store user username and ID
    let usersArray = [];
    //loop to add all usernames and IDs
    for(let i =0; i < users.length; i++){
      usersArray.push({
        username: users[i].username,
        _id: users[i]._id
      });
    }
  //send userArray
  res.send(usersArray);
  });
});

//POST to /api/users/:_id/exercises
app.post('/api/users/:_id/exercises', function(req, res){
  //get exercise info
  const userId = req.params._id;
  const description = req.body.description;
  let duration = req.body.duration;
  const dateReq = req.body.date;

  //turn date string into date
  let date;

  if(dateReq == "" || dateReq == undefined){
    date = new Date();
  }else{
    date = new Date(dateReq);
  }
  date = date.toDateString();
  if(date == "Invalid Date"){
    console.log("New exercise failed: date is not valid " + dateReq + "\n");
  }
  
  //find username
  let usernameFound;
  let newExercise;
  User.findOne({_id: userId})
    .then(function (userIdName) {
    //set username variable
    try{      
      usernameFound = userIdName.username;
      duration = parseInt(duration);
    }catch(e){
      usernameFound="";
      duration = -5;
    }
  }).then(function (userIdName){
      
    if( usernameFound !== "" && description !== "" && duration >= 0){
      Exercise.findOne({_id: userId})
      .then(function(exercise) {
        //create log
        
        try{
          let exerciseArray = [];
          exercise.description = description; //update exercise
          exercise.duration = duration;
          exercise.date = date;
          exercise.save()
          .then(function(data){
            //find user
            Exercise.findOne({_id: userId}, function(err, users) {
              exerciseArray.push({
                _id: users._id,
                username: users.username,
                date: users.date,
                duration: users.duration,
                description: users.description
              });
              //send userArray
              res.send(exerciseArray);
              //Log exercise
              Log.findOne({_id: userId})
              .then(function(logData){
                let newCount = parseInt(logData.count) + 1
                logData.count = newCount;
                //NOT PUSHING DESCRIPTION
                logData.log.push({
                  duration: users.duration,
                  description: users.description,             
                  date: users.date
                });
                logData.save();
              });
            });
          })     
          //if this is the user's first exercise
        }catch(e){
          let newExercise = Exercise({
            username: usernameFound,
            description: description,
            duration: duration,
            date: date,
            _id: userId
          });
          newExercise.save(); // Save exercise
          //send exercise
          res.json({
             _id: newExercise._id, 
            username: newExercise.username,
            date: date,
            duration: duration,
            description: description
          });
          //Log exercise
          let exerciseLog = new Log({
            username: newExercise.username,
            count: 1,
            _id: newExercise._id,
            log: [{
              description: description,
              duration: duration,
              date: date
            }]
          });
          exerciseLog.save();
        } 
        
      }).catch(function(err) {
        console.log("error "+err);
      });
    }
      //if ID doesnt exist
    else{
      console.log("New exercise failed: couldn't find user\n");
    }
  });
});

//GET to /api/users/:_id/logs 
app.get('/api/users/:_id/logs', function(req, res){
  userId= req.params._id
  //const userId = req.params["_id"];
  
  try{
    //GET from, to, limit
    const startDateStr = req.query.from;
    let startDate = null;
    let startDateTrue = false;
    const endDateStr = req.query.to;
    let endDate = null;
    const limitQuery = req.query.limit;
    let limit = null;

    //check to see if 'From' is queried
    if (startDateStr != undefined && startDateStr != "") {
      let startDateMid = new Date(startDateStr);
      startDate = new Date(startDateMid.toDateString());
      //make sure date is real date
      if (startDate == "Invalid Date") {
        startDate = null;
        console.log("Date does not exist");
        return;
      }
    }

    //check to see if 'to' is queried
    if (endDateStr != undefined &&   endDateStr != "") {
      endDate = new Date(endDateStr);
      endDate = new Date(endDate.toDateString())
      //make sure date is real date
      if (endDate == "Invalid Date") {
        endDate = null;
        console.log("Date does not exist");
        return;
      }
    }

    //check to see if 'limit' is queried
    if (limitQuery != undefined && limitQuery != ""){
      try{
        limit = parseInt(limitQuery);
      }catch(e){
        console.log("limit is not an integer");
      }
    }
    if(startDate != null || endDate != null || limit != null){
    Log.findOne({_id: userId})
    .then(function(logData){
      let logArray = [];
      if(logData.count < limit || limit == 0){
        limit = logData.count;
      }
      function logInformation(logData, i) {
      let logInformation = {
        description: logData.log[i].description,
        duration: logData.log[i].duration,
        date: logData.log[i].date
            }
        return logInformation;
      }
      //If nothing is null
      if(startDate != null && endDate != null && limit != null){
        //add until i = limit
        for(let i=0; i<=limit; i++){
          //if it is within start and end date 
          if((startDate.getTime() <= new Date(logData.log[i].date).getTime()) &&
          (endDate.getTime() > new Date(logData.log[i].date).getTime()) && (endDate.getTime() >= startDate.getTime())) {

            //NEW CODE HERE
            logArray.push(logInformation(logData, i));
            
            
          }
        }
      //if start and end are not null
      }else if (startDate != null && endDate != null){
        for(let i=0; i<logData.count; i++){
          //if it is within start and end date 
          if((startDate.getTime() <= new Date(logData.log[i].date).getTime()) &&
          (endDate.getTime() > new Date(logData.log[i].date).getTime()) && (endDate.getTime() >= startDate.getTime())) {
            logArray.push(logInformation(logData, i));
          }
        }
      //if end and limit are not null
      }else if (endDate != null && limit != null){
        for(let i=0; i<limit; i++){
          //if it is within start and end date 
          if(endDate.getTime() > new Date(logData.log[i].date).getTime()) {
            logArray.push(logInformation(logData, i));
          }
        }
      //if start and limit are not null
      }else if(startDate != null && limit != null){
        for(let i=0; i<limit; i++){
          //if it is within start and end date 
          if(startDate.getTime() <= new Date(logData.log[i].date).getTime()) {
            logArray.push(logInformation(logData, i));
          }
        }
      //if from is not null
      }else if(startDate != null){
        for(let i=0; i<logData.count; i++){
          //if it is within start and end date 
          if(startDate.getTime() <= new Date(logData.log[i].date).getTime()) {
            logArray.push(logInformation(logData, i));
          }
        }
      //if to is not null
      }else if(endDate != null){
         for(let i=0; i<logData.count; i++){
          //if it is within start and end date 
          if(endDate.getTime() > new Date(logData.log[i].date).getTime()) {
            logArray.push(logInformation(logData, i));
          }
        }
      //if limit is not null
      }else if(limit != null){ 
         for(let i=0; i<limit; i++){
          //if it is within start and end date 
          logArray.push(logInformation(logData, i));
        }
      }
      if(startDate != null && endDate != null){
          res.json({
            _id: logData._id,
            username: logData.username,
            from: startDate,
            to: endDate,
            count: logData.count,
            log: logArray
          });
        }else if(endDate != null){
          res.json({
            _id: logData._id,
            username: logData.username,
            to: endDate,
            count: logData.count,
            log: logArray
          });
        }else if(startDate != null){
          res.json({
            _id: logData._id,
            username: logData.username,
            from: logData.date,
            count: logData.count,
            log: logArray
          });
        }
      else {
        res.json({
          _id: logData._id,
          username: logData.username,
          count: logData.count,
          log: logArray
        });
      }         
    });

      
    }//end of primary if
    //if no extra parameters
    else{
      Log.findOne({_id: userId}) //find user logs
      .then(function(logData){
        let logArray = [];
        for(let i=0; i<logData.count; i++){
          //if it is within start and end date 
          logArray.push({
            description: logData.log[i].description,
            duration: logData.log[i].duration,
            date: logData.log[i].date
          });
        }
        res.json({
          _id: logData._id, 
          username: logData.username,
          count: logData.count,
          log: logArray
        });
      }); //get user info
    }


  }catch(e){
    console.log("err ! "+ e + " User ID does not exist.");
  }
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
