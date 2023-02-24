const express  = require("express");
const dotenv = require("dotenv");
const { chats } = require("./data/data");
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const userRouters = require('./routes/userRoutes');
const chatRouters = require('./routes/chatRoutes');
const messageRouters = require('./routes/messageRoutes');
const path = require('path');
const cors = require('cors');

dotenv.config();

connectDB();
const app = express();

app.use(express.json()); // to accept json data

app.use(cors({
  origin: 'https://vibechatting.netlify.app'
}));

  

app.get("/",(req,res)=>{
 res.send( "API is Running");
})
app.use(cors({
  origin: 'https://vibechatting.netlify.app'
}));

app.use("/api/user", userRouters);
app.use("/api/chat", chatRouters);
app.use("/api/message", messageRouters);

// --------------Deployment-------------

// const __dirname1 = path.resolve();

// if (process.env.NODE_ENV === "production") {
//   app.use(express.static(path.join(__dirname1, "/frontend/build")));

//   app.get("*", (req, res) =>
//     res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"))
//   );
// } else {
//   app.get("/", (req, res) => {
//     res.send("API is running..");
//   });
// }

// --------------Deployment-------------
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT ;
 const server = app.listen(PORT, console.log(`Server Started on PORT http://localhost:${PORT}`))

 
 const io = require("socket.io")(server, {
    pingTimeout : 60000,
    cors : {
        origin: "https://vibechatting.netlify.app/",
    },
 });

 io.on("connection", (socket) => {
    console.log("connected to socket.io");
    socket.on("setup", (userData) => {
         socket.join(userData._id);
         //console.log(userData._id);
         socket.emit("connected");
    });

    socket.on('join chat',(room) => { 
      socket.join(room);
      console.log("User Joined Room :" + room);
    })

   socket.on("typing", (room) => socket.in(room).emit("typing"));
   socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

     socket.on("new message", (newMessageRecieved) => {
       var chat = newMessageRecieved.chat;

       if(!chat.users) return console.log("chat.users not defined");

       chat.users.forEach((user) => {
          if (user._id == newMessageRecieved.sender._id) return;

          socket.in(user._id).emit('message recieved', newMessageRecieved);
       });
     });

     socket.off("setup", () => {
      console.log("USER DISCONNECTED");
      socket.leave(userData._id);
     });
 }); 
 
