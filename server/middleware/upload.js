const cloudinary = require('cloudinary').v2;
const ffmpeg = require("ffmpeg");
const fs = require("fs");

const User = require("../config/db").User;
const Post = require("../config/db").Post;

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_KEY,
    api_secret: process.env.CLOUD_SECRET,
});

exports.fileUploadMiddleware= async function (req, res, next) {
    if (req.file){
        try{
            console.log(req.file.path);
            let process = new ffmpeg("./"+req.file.path);
            process.then(function (video) {
                console.log("in");
                let newName = req.body.title.split(" ").join("_");

                video
                    .setVideoSize('640x480', true, true, '#ffffff')
                    .save(`./newFiles/${newName}.mp4`, function (error, file) {
                        //console.log(error);
                        if (!error){
                            console.log('Video file: ' + file);
                            cloudinary.uploader.upload(file, {
                                resource_type: "video"
                            }, async function (err,result){
                                if(err){
                                    return next(err);
                                }
                                else{
                                    try{
                                        let date = new Date();
                                        let post = await Post.create({
                                            title: req.body.title,
                                            by: req.params.id,
                                            videoURL: result.secure_url,
                                            timestamp : {
                                                date : date.getDate(),
                                                month : date.getMonth(),
                                                year : date.getFullYear(),
                                                hours : date.getHours(),
                                                mins : date.getMinutes(),
                                                secs : date.getSeconds()
                                            }
                                        });
                                        let {id} =post;
                                        await User.findByIdAndUpdate(req.params.id, {$push: {uploadedPosts: id}});
                                        await res.status(200).json({
                                            post
                                        });
                                        try{
                                            fs.unlinkSync(file);
                                            fs.unlinkSync("./"+req.file.path);
                                        } catch (e) {
                                            console.log(e);
                                        }
                                    } catch (e) {
                                        return next(e);
                                    }
                                }
                            });
                        } else {
                            return next(error);
                        }
                    });

            }, function (err) {
                console.log('Error: ' + err);
                return next(err);
            });
        } catch (e) {
            console.log(e.code);
            console.log(e.msg);
            return next(e);
        }
    } else {
        let err = {
            message: "Upload Failed"
        }
        return next(err);
    }

};