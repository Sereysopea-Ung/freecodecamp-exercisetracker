const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');
const ObjectId= require('mongodb').ObjectId;
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI);

const User = mongoose.model('User', new mongoose.Schema({
  username: {type: String, required: true}
}));

const Exercises = mongoose.model('Exercises', new mongoose.Schema({
  description: {type:String, required: true},
  duration: {type:Number, required: true},
  date: String,
  userID: String
}));

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: false}));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', (req,res)=>{
  let newUser = new User({
    username: req.body.username
  });
  newUser.save((err,data)=>{
    if (err) return console.log(err);
    res.json({
      username: data.username,
      _id: data.id
    });
  });
});

app.get('/api/users',(req,res)=>{
  let array=[];
  User.find({},function(err,allUserArray){
    if (err) return console.log(err);
    let returnArray = allUserArray.map(user=>{
      return {username:user.username,_id:user.id};
    })

    res.json(returnArray);
  });
});

function convertDate(date){
  if (date){
    return new Date(date).toDateString();
  } else {
    return new Date().toDateString();
  }
}

app.post('/api/users/:_id/exercises',(req,res)=>{
  User.findById(req.params['_id'],function(err,user){
    if (err) return console.log(err);
    if(req.params['_id']){
      new Exercises({
        description: req.body.description,
        duration: parseInt(req.body.duration),
        date: convertDate(req.body.date),
        userID: req.params['_id']
      }).save((err,exercise)=>{
        if (err) return console.log(err);
        res.json({
          username: user.username,
          description: exercise.description,
          duration: exercise.duration,
          date: exercise.date,
          _id: req.params['_id']
        });
      });
    } else {
      return res.send("ID NOT FOUND");
    }
  });
});

app.get('/api/users/:_id/logs',(req,res)=>{
  Exercises.find({userID: req.params._id},(err, exercisesArray)=>{
    if (err) return console.log(err);
    let log = exercisesArray.map((exercise)=>{ return {description:exercise.description, duration:exercise.duration,date:exercise.date}});
    let count = log.length;
    if (req.query.from){
      log = log.filter((exercise)=> new Date(exercise.date).getTime() >= new Date(req.query.from).getTime());
    }
    if (req.query.to){
      log = log.filter((exercise)=> new Date(exercise.date).getTime() <= new Date(req.query.to).getTime());
    }
    if (req.query.limit){
      log = log.slice(0,req.query.limit);
    }
    User.findById(req.params._id,(err,user)=>{
      if (err) return console.log(err);
      res.json({
        username: user.username,
        count: count,
        _id: req.params._id,
        log: log
      });
    });
  });
});
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
