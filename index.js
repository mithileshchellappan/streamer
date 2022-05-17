const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require('fs')
const app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + file.originalname);
  }
});

const maxSize = 100000000;

var upload = multer({
  storage: storage,
  limits: { fileSize: maxSize },
  fileFilter: function (req, file, cb) {
    var filetypes = /mp4|mov/;

    var mimetype = filetypes.test(file.mimetype);

    var extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if(mimetype&&extname){
        return cb(null,true)
    }
    cb("Error:File upload only supports "+filetypes)
  }
}).single('vid');

app.get("/",function(req,res){
    console.log(__dirname)
    res.render("init")
})

app.post('/uploadFile',function(req,res,next){
    upload(req,res,function(err){
        if(err){
            res.send(err)
            console.log('in err')
        }else{
            console.log(req.file.filename)
            res.redirect(`/video/${req.file.filename}`)
        }
    })
})

app.get("/video/:id",function(req,res){
    var id = req.params.id
    res.render("video",{videoLink:`/renderVid/${id}`})
    console.log(id)
    
})

app.get("/renderVid/:id",function(req,res){
    const range = req.headers.range;
    if(!range){
        res.sendStatus(400).send("Requires Range Header")
    }
    
    const videoPath = `${__dirname}/uploads/${req.params.id}`
    const videoSize = fs.statSync(videoPath).size

    const CHUNK_SIZE = 10**6
    const start = Number(range.replace(/\D/g,""))
    const end =Math.min(start+CHUNK_SIZE,videoSize-1)
    const contentLength = end-start+1;

    const headers = {
        "Content-Range":`bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges":"bytes",
        "Content-Length":contentLength,
        "Content-Type":"video/mp4"
    }
    res.writeHead(206,headers);
    const videoStream = fs.createReadStream(videoPath,{start,end})
    videoStream.pipe(res)
})

app.listen(9000)
