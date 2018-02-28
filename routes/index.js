var crypto = require("crypto");
var User = require("../models/user");
var Post = require("../models/post");
var mongoose = require('mongoose');

module.exports = function (app) {
    /* GET home page. */
    app.get('/', function (req, res) {
        User.find().then(users => {
            var userInfo = {};
            for(user of users){
                userInfo[user.name] = user.avatar;
            }
            Post.find({isDeleted: false}).sort('-createdDate').then(posts => {
                var results = [];
                    for(let post of posts){
                        results.push({
                            avatar:userInfo[post.creator],
                            post:post
                    })
                }
                res.render('index', {
                    title: '首页',
                    results: results,
                    expressFlash: req.flash()
                });
            }).catch(err => {
                req.flash('alert-danger', err);
                return res.redirect('/');
            });
        }).catch(err => {
            req.flash('alert-danger', err);
            return res.redirect('/');
        });
    });

    app.get('/reg', checkNotLogin);

    /* GET register page. */
    app.get('/reg', function (req, res) {
        res.render('reg', {
            title: '用户注册',
            expressFlash: req.flash()
        });
    });

    app.post('/reg', checkNotLogin);
    /* POST register page. */
    app.post('/reg', function (req, res) {
        //检验用户两次输入的口令是否一致
        if (req.body['password-repeat'] != req.body['password']) {
            req.flash('alert-danger', '两次输入的口令不一致');
            return res.redirect(301, '/reg');
        }
        
        User.find().then(result => {
            //生成avatar
            var count = result.length + 1;
            var avatar = "https://randomuser.me/api/portraits/med/men/" + count +".jpg";
            //生成口令的散列值
            var md5 = crypto.createHash('md5');
            var password = md5.update(req.body.password).digest('base64');
            
            const newUser = new User({
                _id: new mongoose.Types.ObjectId(),
                name: req.body.username,
                password: password,
                avatar
            });

            //追加新用户至DB
            newUser.save().then(result => {
                count++;
                req.session.user = newUser;
                req.flash('alert-success', '注册成功');
                return res.redirect(301, '/');
            })
            .catch(err => {
                let errormessage = "注册失败";
                if (err.name == 'BulkWriteError') {
                    errormessage = "该用户名已被占用";
                } else if (err.name == 'ValidationError') {
                    errormessage = "用户名格式不正确";
                }
                req.flash('alert-danger', errormessage);
                return res.redirect(301, '/reg');
            });
        }).catch(
            err => {
                let errormessage = "注册失败";
                req.flash('alert-danger', errormessage);
                return res.redirect(301, '/reg');
        });
    });

    app.get('/login', checkNotLogin);
    /* GET login page. */
    app.get('/login', function (req, res) {
        res.render('login', {
            title: '用户登录',
            expressFlash: req.flash()
        });
    });

    app.post('/login', checkNotLogin);
    /* Post login page. */
    app.post('/login', function (req, res) {
        //生成口令的散列值
        var md5 = crypto.createHash('md5');
        var password = md5.update(req.body.password).digest('base64');

        User.findOne({'name': req.body.username}).then(user => {
            if (!user) {
                req.flash('alert-danger', '用户不存在');
                return res.redirect(301, '/login');
            }

            if (user.password != password) {
                req.flash('alert-danger', '用户口令错误');
                return res.redirect(301, '/login');
            }
            req.session.user = user;
            req.flash('alert-success', '登录成功');
            return res.redirect(301, '/');
        })
            .catch(err => {
                req.flash('alert-danger', '登录失败');
                return res.redirect(301, '/login');
            });
    });

    app.post('/post', checkLogin);
    app.post('/post', function (req, res) {
        var currentUser = req.session.user;
        var post = new Post({
            creator: currentUser.name,
            post: req.body.post,
            isDeleted: false
        });
        post.save().then(() => {
            req.flash('alert-success', '发表成功');
            res.redirect('/u/' + currentUser.name);
        })
            .catch(err => {
                req.flash('alert-danger', '发表失败');
                return res.redirect('/');
            })

    });

   
    //get user page
    app.get('/u/:user', function (req, res) {
        User.findOne({ 'name': req.params.user }).then(user => {
            if (!user) {
                req.flash('alert-danger', '用户不存在');
                return res.redirect('/');
            }
            Post.find({ 'creator': req.params.user, isDeleted: false}).sort('-createdDate').then(posts => {
                var results = [];
                for(let post of posts){
                    results.push({
                        avatar:user.avatar,
                        post:post
                    })
                }
                res.render('user', {
                    title: user.name,
                    results: results,
                    expressFlash: req.flash()
                });
            }).catch(err => {
                req.flash('alert-danger', err);
                return res.redirect('/');
            });
        })
            .catch(err => {
                req.flash('alert-danger', err);
                return res.redirect('/');
            });
    })

    app.get('/setPassword', checkLogin);
    app.get('/setPassword', function (req, res) {
        res.render('setPassword', {
            title: '修改密码',
            expressFlash: req.flash()
        });

    });

    app.post('/setPassword', checkLogin);
    app.post('/setPassword', function (req, res) {
        var currentUser = req.session.user;
        User.findOne({ 'name': currentUser.name }).then(user => {
            var md5_old = crypto.createHash('md5');
            var password = md5_old.update(req.body.oldPW).digest('base64');
            if (user.password == password) {
                var md5_new = crypto.createHash('md5');
                let newPW = md5_new.update(req.body.newPW).digest('base64');
                user.set({ password: newPW });
                user.save().then(result => {
                    req.flash('alert-success', '密码修改成功');
                    res.redirect('/');
                }).catch(err => {
                    req.flash('alert-danger', '密码修改失败');
                    res.redirect('/setPassword');
                });
            } else {
                req.flash('alert-danger', '密码错误');
                return res.redirect('/setPassword');
            }
        })
        .catch(err => {
            console.log(err);
            req.flash('alert-danger', '用户不存在');
            return res.redirect('/setPassword');
        })

    });

    app.post('/logout', checkLogin);
    /*Logout*/
    app.post('/logout', function (req, res) {
        req.session.user = null;
        req.logout();
        req.flash('alert-success', '退出成功');
        return res.redirect(301, '/');
    });

    app.post('/search', function(req, res){
        var keyWord = req.body['keyWord'];
        User.find({ name: {$regex: keyWord, $options: 'i'}}).then(user => {
            res.render('search', {
                title: '搜索',
                searchResult: user
            });
        })
        .catch(err => {
            req.flash('alert-danger', '搜索失败');
            return res.redirect('/');
        });
    })

    //检查是否登录
    function checkLogin(req, res, next) {
        console.log("check login");
        if (!req.session.user) {
            req.flash('alert-danger', '未登录');
            return res.redirect('/login');
        }
        next();
    }
    function checkNotLogin(req, res, next) {
        if (req.session.user) {
            req.flash('alert-danger', '已登录');
            return res.redirect('/');
        }
        next();
    }
};
