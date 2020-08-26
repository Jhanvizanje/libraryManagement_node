const sql=require("mysql");
const express=require("express");
const bodyParser=require("body-parser");
const multer=require("multer");
const session =require("express-session");
const { response } = require("express");

const app=express();
app.set("view engine","ejs");

app.use(session({secret:"it is a session",saveUninitialized:false}));
app.use(bodyParser.urlencoded({extended:"true"}));
app.use(express.static("public"));

const con=sql.createConnection({
    host:"localhost",
    user:"",
    password:"",
    // database:"javaproject"
    database:"library_node"
});

var sess;


//upload imgs of book cover in a folder using multer
var fname;
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/uploads')
    },
    filename: function (req, file, cb) {
        //fname=file.fieldname;
      cb(null, req.body.bname+".jpg")
    }
  })
   
var upload = multer({ storage: storage })


//get and post methods

app.get("/",function(req,res){
    res.render("login",{msg:""});
});


app.get("/admin",function(req,res){
    sess=req.session;
    if(sess.uid)
        res.sendFile(__dirname+"/admin.html");
    else
        res.redirect("/");
});


app.get("/user",function(req,res){
    sess=req.session;
    if(sess.uid)
        res.render("user",{name:sess.name});
    else
        res.redirect("/");
});

app.post("/search",function(req,res){
    const stmt="select * from books where b_name='"+req.body.name+"'";
    con.query(stmt,function(err,result){
        console.log(result);
        if(!err && result.length!=0)
            res.render("lstBooks",{books:result,msg:"Book found"});
        else
            res.render("lstBooks",{books:result,msg:"No Book found"});
    });
})


app.get("/booksList",function(req,res)
{
    const stmt="select * from books";
    con.query(stmt,function(err,result,field){
        if(!err && result.length!=0)
            res.render("lstBooks",{books:result,msg:""});
        else if(!err && result.length==0)
            res.render("lstBooks",{books:result,msg:"No books available yet"});
    });
});

app.get("/usersList",function(req,res)
{
    const stmt="select * from users";
    con.query(stmt,function(err,result,field){
        if(!err && result.length!=0)
            res.render("lstUsers",{users:result,msg:""});
        else if(!err && result.length==0)
            res.render("lstUsers",{users:result,msg:"No Users added yet"});
            
    });
});

app.get("/issuedBooksList",function(req,res)
{
    const stmt="select * from issuedbooks";
    con.query(stmt,function(err,result,field){                
        if(!err && result.length!=0)
            res.render("issuedBooks",{books:result,msg:""});
        else if(!err && result.length==0)
            res.render("issuedBooks",{books:result,msg:"No Books issued yet"});
            
    });
});

app.get("/addBook",function(req,res){
    res.sendFile(__dirname+"/addBook.html");
});

app.get("/myBooksList",function(req,res)
{
    console.log("get method in Mybooks");
    var ses=req.session;
    var id=ses.uid;
    console.log("ses="+id);
    const stmt="select * from issuedbooks where u_id='"+id+"'";
    con.query(stmt,function(err,result,field){                
        if(!err && result.length!=0)
            res.render("issuedBooks",{books:result,msg:""});
        else if(!err && result.length==0)
            res.render("issuedBooks",{books:result,msg:"No Books issued yet"});
            
    });
});

app.get("/logout",function(req,res){
    req.session.destroy(function(err){
        if(err)
            console.log(err);
        else
            res.redirect("/");
    });
    
});



app.post("/login",function(req,res){    
    const name=req.body.name;
    const pwd=req.body.pwd;
    const stmt="select * from users where u_name='"+name+"' and pwd='"+pwd+"'";
    con.query(stmt,function(err,result){
        console.log(result[0].isAdmin);
        if(err)
            console.log(err);
        else if(result.length==0)
            res.render("login",{msg:"Incorrect user name/Password"});
        else
        {
            sess=req.session;
            sess.uid=result[0].u_id;
            sess.name=result[0].u_name;
            if(result[0].isAdmin=="yes")
                res.redirect("/admin");
            else
                res.redirect("/user");
        }
    });
});



app.post("/addBook",upload.single('img'),function(req,res,next){
   
    const stmt="select * from books where b_name='"+req.body.bname+"' && a_name='"+req.body.aname+"'";
    con.query(stmt,function(err,result,field){
        if(!err)
        {
            console.log(result.length);
            if(result.length==0)
            {
                
                //  fname=req.body.img.originalname;
                //  console.log(fname);
                const stmt1="insert into books values(null,'"+req.body.bname+"','"+req.body.aname+"',"+parseInt(req.body.price)+","+parseInt(req.body.stock)+","+parseInt(req.body.stock)+")";
                con.query(stmt1,function(err,result){
                    if(!err)
                    res.redirect("/admin");
                    else
                        console.log(err);
                });
            }
            else{
                if(!err)
                {
                    const stock=result[0].stock+parseInt(req.body.stock);
                    const astock=result[0].ava_stock+parseInt(req.body.stock);
                    const stmt1="update books set stock="+stock +",ava_stock="+astock+" where b_id="+result[0].b_id+"";
                    con.query(stmt1,function(err,result){
                        if(err)
                            console.log(err);
                        else
                            res.redirect("/admin");
                    })
                }
                else
                    console.log(err);
                
            }
        }
    });
});

app.get("/addUser",function(req,res){
    res.render("registration",{msg:""});
});

app.post("/addUser",function(req,res){
    const stmt="select * from users where email='"+req.body.email+"'";
    con.query(stmt,function(err,result,field){
        if(!err)
        {
            if(result.length==0)
            {
                con.query("insert into users values(null,'"+req.body.uname+"','"+req.body.email+"','"+req.body.pwd+"','no')",function(err,result){
                res.redirect("/admin");
                });
            }
            else{
               res.render("registration",{msg:"User Already Exist!!"});
            }
        }
     

    });
});

app.get("/issueBook",function(req,res){
    res.render("issueBook",{msg:""});
});

app.post("/issueBook",function(req,res){
    con.query("select * from users where pwd='"+req.body.pwd+"' && u_id="+req.body.uid+"",function(err,result,field){
        if(err)
            console.log(err);
        else{
            if(result.length==0)
                res.render("issueBook",{msg:"incorrect password or userID"});
            else
            {
                stmt1="select * from books where b_id="+req.body.bid+"";
                con.query(stmt1,function(err,result1,field){
                    if(err)
                        console.log(err);
                    else
                    {
                        if(result1[0].ava_stock!=0)
                        {
                            const stmt="insert into issuedBooks values(null,'"+req.body.bid+"','"+req.body.uid+"','"+(req.body.idate).toString()+"','Not returned',"+parseInt(req.body.period)+","+parseInt("0")+")";
                            con.query(stmt,function(err,result){
                                if(err)
                                    console.log(err);
                                else
                                {
                                    const stmt3="update books set ava_stock="+(result1[0].ava_stock-1)+" where b_id="+result1[0].b_id+"";
                                    con.query(stmt3,function(err,result3){
                                        if(err)
                                            console.log(err);
                                        else
                                        res.render("issueBook",{msg:"Book issued..thank you"});
                                    });
                                    
                                    
                                }
                            });
                            
                        }
                    }
                });


            }
                
        }
    });
});

app.get("/returnBook",function(req,res){
    res.render("returnBook",{msg:""});
});

app.post("/returnBook",function(req,res){
    con.query("select * from issuedBooks where ib_id="+req.body.ib_id+"",function(err,result){
        console.log("in1");
        if(err)
            console.log(err);
        else if(result.length!=0 && result[0].return_date==null){
            const a1=(result[0].issued_date).split('-');
            const a2=((req.body.rdate).toString()).split('-');
            console.log(a1+":"+a2);
            const iy=parseInt(a1[0]);
            const ry=parseInt(a2[0]);
            const im=parseInt(a1[1]);
            const rm=parseInt(a2[1]);
            const id=parseInt(a1[2]);
            const rd=parseInt(a2[2]);
            const sum=((ry-iy)*365)+((rm-im)*30)+(rd-id);
            console.log(sum+":"+ry+":"+iy);

            


            if((sum-(result[0].period))>0)
                var fine=(sum-(result[0].period))*2;
            else
                var fine=0;
            con.query("update issuedbooks set return_date='"+(req.body.rdate).toString()+"',fine="+fine+" where ib_id="+req.body.ib_id+"",function(err,result1){

                if(!err)
                {
                    stmt1="select * from books where b_id="+result[0].b_id+"";
                    con.query(stmt1,function(err,result2,field){
                        const stmt3="update books set ava_stock="+(result2[0].ava_stock+1)+" where b_id="+result[0].b_id+"";
                     con.query(stmt3,function(err,result3){
                        if(err)
                            console.log(err);
                        else
                            res.render("returnBook",{msg:"Fine="+fine});
                    });

                    });
                    
                }
                else    
                    console.log(err);
            });

            
        }
        else if(result.length!=0 && result[0].return_date!=null)
        {
            console.log("in2");
            res.render("returnBook",{msg:"You have already return your book on"+result[0].return_date});
        }
        else
        {
            console.log("in3");
            res.render("returnBook",{msg:"No such ID"});
        }
    })
});




app.get("/createDatabase",function(req,res){

    con.query("create table books(b_id int(255)  primary key auto_increment,b_name varchar(255),a_name varchar(255),price int(255),stock int(255),ava_stock int(255))",function(err,result)
    {
        if(err)
            console.log(err);
        else
            console.log("created");
    });
    con.query("create table issuedbooks(ib_id int(255) primary key auto_increment,b_id int(255),u_id int(255),issued_date varchar(255),return_date varchar(255),period int(255),fine int(255))",function(err,result)
    {
        if(err)
            console.log(err);
        else
            console.log("created");
    });
    con.query("create table users(u_id int(255) primary key auto_increment,u_name varchar(255),email varchar(255),pwd varchar(255),isAdmin varchar(3))",function(err,result)
    {
        if(err)
            console.log(err);
        else
            res.redirect("/admin");
    });
    
});


app.listen(3000,function(err){
    console.log("successfull");
});

