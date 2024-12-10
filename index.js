const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const {users, JWT_SECRET, PORT, API_KEY} = require('./utils/data')
const cors = require('cors')

const app = express();
app.use(cors());
app.use(express.json());

// user login API
app.post('/login', (req, res) => {
    let {email, password} = req.body;

    const user = users.find(user => user.email === email && user.password === password);
    
    if(user){
        const token = jwt.sign({userId: user.id}, JWT_SECRET, {expiresIn: '1h'});
        return res.json({message: 'Login Successful', token});
    }

    return res.status(400).json({message: 'Invalid credentials'})
});

// user sign up API
app.post('/signup', (req, res) => {
    const {email, password} = req.body;
    
    const user = users.find(user => user.email === email)

    if(user){
        return res.status(400).json({message: 'user already exist!'})
    }

    const newuser = {id: users.length + 1, email, password};
    users.push(newuser);
    console.log(users)
    return res.status(200).json({message: 'user signed up successfully!'})
});


//meddleware
let auth = (req, res, next) => {
    let token = req.headers['authorization']?.split(' ')[1];
    console.log("token-", token)
    if(!token){
        return res.status(403).json({message: 'Access is denied!!'})
    }

    jwt.verify(token, JWT_SECRET, (err, data) => {
        if(err){
            console.log(err)
            return res.status(403).json({message: 'token is not correct!!'});
        }
        console.log("data-", data)
        req.data = data;
        next();
    })
}


app.get('/weather', auth, async(req, res) => {
    const{latitude, longitude} = req.query;

    if (!latitude && !longitude){
        return res.status(400).json({message:"latitude and longitude are mandatory!!"});
    }

    try{
    //https://openweathermap.org/current
    const curWeather = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`);
    // console.log("curWeather- ", curWeather.data);

    //https://openweathermap.org/forecast16
    const weatherForecast = await axios.get(`https://api.openweathermap.org/data/2.5/forecast/?lat=${latitude}&cnt=5&appid=${API_KEY}&lon=${longitude}`)
    console.log("weatherForecast- ",weatherForecast.data)

    return res.status(200).json({
        currentWeather: curWeather.data,
        weatherForecast: weatherForecast.data
    });
    }
    catch(e){
        console.log(e)
        return res.status(500).json({message: "recieved error while getting weather data!!!"})
    }

})


app.listen(PORT, () => {
    console.log(`server is listening to port ${PORT}`)
})
