const bp = require("body-parser");
const express = require("express");
const app = express();
const dotenv = require("dotenv").config();
const router = express.Router();
const cors = require('cors');
const redis = require('redis');
const redisClient = redis.createClient()
const session = require('express-session');
const cookieParser = require('cookie-parser');

let sess_time = 60*60*1000;
app.use(session({
    secret: "YCK",
    saveUninitialized: true,
    cookie: { maxAge: sess_time },
    resave: false
}));
app.use(cors());
app.use("/", router);
router.use(cookieParser());
router.use(bp.json());

const mysql = require('mysql2');
var connection = mysql.createConnection('mysql://ac2sktxqfdmmwwuq:ijhrbb46u33u6q3s@l6glqt8gsx37y4hs.cbetxkdyhwsb.us-east-1.rds.amazonaws.com:3306/yjb49mguc8gvpoy7');

// router.post('/recommendproduct', function (req, res) { //if user not login, how to recommend
//     let sess = req.session;
//     let categoryID = sess.categoryID;
//     let data = [];
//     for(i=0 ; i<categoryID.length ; i++) {
//         connection.query('SELECT * FROM Product WHERE categoryID = ? ORDER BY sold_amount DESC LIMIT 10', categoryID[i], function (error, results) {
//             if(error) {
//                 console.log(error);
//                 connection.destroy();
//             }
//             data = data.concat(results);
//         });
//     }
//     if(data.length > 0) {
//         return res.send({error : false,
//                 data: data,
//                 message : `retrive recommend product successfully`
//         });
//     }
//     else {
//         return res.send({error : true,
//                 message : `retrive recommend product unsuccessfully`
//         });
//     }
// });

router.get('/categories', function (req, res) {
    // redisClient.get('categoryLists', async(error, data) => {
    //     if(error) {
    //         return res.send({error : true,
    //                         message : "something error"
    //         });
    //     }
    //     if(data) {
    //         return res.send({error : false,
    //                         data: JSON.parse(data),
    //                         message : "retrive category successfully"
    //         });
    //     }
    //     connection.query('SELECT * FROM Category', function (error, results) {
    //         if(error) {
    //             console.log(error);
    //             connection.destroy();
    //         }
    //         redisClient.setEx('categoryLists', 1800, JSON.stringify(results));
    //         return res.send({error : false,
    //                         data: results,
    //                         message : "retrive category successfully"
    //         });
    //     });
    // });
    connection.query('SELECT * FROM category', function (error, results) {
        if(error) {
            console.log(error);
            return res.send({error: true, message: "retrive category unsuccessfully"});
        }
        return res.send({error : false,
                        data: results,
                        message : "retrive category successfully"
        });
    });
});

/*
    Request Body
    {
        "categoryID" : ""
    }
*/
router.post('/productbycategory', function (req, res) {
    categoryID = req.body.categoryID;
    // redisClient.get(categoryID, async(error, data) => {
    //     if(error) {
    //         return res.send({error : true,
    //                         message : "something error"
    //         });
    //     }
    //     if(data) {
    //         return res.send({error : false,
    //                         data: JSON.parse(data),
    //                         message : "retrive product successfully"
    //         });
    //     }
    //     connection.query('SELECT * FROM product WHERE categoryID = ?', categoryID, function (error, results) {
    //         if(error) {
    //             console.log(error);
    //             connection.destroy();
    //         }
    //         redisClient.setEx(categoryID, 900, JSON.stringify(results));
    //         return res.send({error : false,
    //                         data: results,
    //                         message : "retrive category successfully"
    //         });
    //     });
    // });
    connection.query('SELECT * FROM product p INNER JOIN prod_cate pc ON p.productID = pc.produtID INNER JOIN category c ON pc.categoryID = c.categoryID WHERE pc.categoryID = ?', categoryID, function (error, results) {
        if(error) {
            console.log(error);
            return res.send({error: true, message: `retrive category ${categoryID} unsuccessfully`});
        }
        return res.send({error : false,
                        data: results,
                        message : "retrive category successfully"
        });
    });
});

/*
    Request Body
    {
        "productID" : ""
    }
*/
router.post('/productinfo', function (req, res) { //wait for DB to fix
    let productID = req.body.productID;
    connection.query('SELECT * FROM product p INNER JOIN sub_detail s ON p.sub_detailID = s.sub_detailID INNER JOIN material m ON p.materialID = m.materialID WHERE productID = ?;', productID, function (error, results) {
        if(error) {
            console.log(error);
            return res.send({error: true, message: `retrive product ${productID} unsuccessfully`});
        }
        return res.send({error : false,
                        data: results[0],
                        message : `retrive product ${productID} successfully`
        });
    });
});

/*
    Request Body
    {
        "product": {
            "productID": "",
            "price": 7,
            "treasury": 4,
            "name": "",
            "description": "",
            "rating": 0,
            "image": "",
            "min_unit": 10,
            "unit": 100,
            "sku": "",
            "isAvailable": 1,
            "sold_amount": 0,
            "materialID": "",
            "sub_detailID": "",
            "shopID": ""
        },
        "material": {
            "materialID": "",
            "image1": "",
            "image2": "",
            "image3": "",
            "image4": "",
            "image5": "",
            "video": ""
        },
        "sub_detail": {
            "sub_detailID": "",
            "source": "",
            "brand": "",
            "weight": 20,
            "size": "",
            "material": ""
        }
    }
*/
router.post('/updateproduct', function (req, res) { //wait for DB to fix
    let product = req.body.product;
    let productID = product.productID
    let sub_detailID = product.sub_detailID;
    let sub_detail = req.body.sub_detail;
    let materialID = product.materialID;
    let material = req.body.material;
    let curDateTime = currenDateTime();
    product.update_time = curDateTime;
    connection.query('UPDATE product SET ? WHERE productID = ?', [product, productID], function (error, results) {
        if (error){
            console.log(error);
            return res.send({error: true, message: `update product ${productID} unsuccessfully`});
        } 
        connection.query('UPDATE sub_detail SET ? WHERE sub_detailID = ?', [sub_detail, sub_detailID], function (error, results) {
            if (error){
                console.log(error);
                return res.send({error: true, message: `update product ${productID} unsuccessfully`});
            } 
            connection.query('UPDATE material SET ? WHERE materialID = ?', [material, materialID], function (error, results) {
                if (error){
                    console.log(error);
                    return res.send({error: true, message: `update product ${productID} unsuccessfully`});
                } 
                return res.send({error: false, message: `update product ${productID} successfully`});
            });
        });
    });
});

/*
    Request Body
    {
        "product": {
            "productID": "0000002",
            "price": 7,
            "treasury": 4,
            "name": "Pen",
            "description": "a testing product (updated)",
            "rating": 0,
            "image": "img_url",
            "min_unit": 10,
            "unit": 100,
            "sku": "00000000000000000021",
            "isAvailable": 1,
            "sold_amount": 0,
            "materialID": "m000002",
            "sub_detailID": "sd00002",
            "shopID": "test001"
        },
        "material": {
            "materialID": "m000002",
            "image1": "img2_url",
            "image2": "img2_url",
            "image3": "img2_url",
            "image4": "img2_url",
            "image5": "img2_url",
            "video": "video2_url"
        },
        "sub_detail": {
            "sub_detailID": "sd00002",
            "source": "update testing",
            "brand": "testing",
            "weight": 20,
            "size": "large",
            "material": "Aluminium"
        }
    }
*/
router.post('/addproduct', function (req, res) { //wait for DB to fix
    let product = req.body.product;
    let sub_detail = req.body.sub_detail;
    let material = req.body.material;
    let curDateTime = currenDateTime();
    product.create_time = curDateTime;
    product.update_time = curDateTime;
    connection.query('INSERT INTO sub_detail SET ? ', sub_detail, function (error, results) {
        if (error){
            console.log(error);
            return res.send({error: true, message: `create new product unsuccessfully`});
        } 
        connection.query('INSERT INTO material SET ? ', material, function (error, results) {
            if (error){
                console.log(error);
                return res.send({error: true, message: `create new product unsuccessfully`});
            }
            connection.query('INSERT INTO product SET ? ', product, function (error, results) {
                if (error){
                    console.log(error);
                    return res.send({error: true, message: `create new product unsuccessfully`});
                }
                return res.send({error: false, message: `create new product successfully`});
            }); 
        });
    });
});

/*
    Request Body
    {
        "productID" : ""
    }
*/
router.delete('/deleteproduct', function (req, res) { //not sure wait for meeting
    let productID = req.body.productID;
    let materialID = new String();
    let sub_detailID = new String();
    connection.query('SELECT materialID, sub_detailID FROM product WHERE productID = ?', productID, function (error, results) {
        if (error){
            console.log(error);
            return res.send({error: true, message: `delete product ${productID} unsuccessfully`});
        }
        materialID = results[0].materialID;
        sub_detailID = results[0].sub_detailID;
        connection.query('DELETE FROM product WHERE productID = ?', productID, function (error, results) {
            if (error){
                console.log(error);
                return res.send({error: true, message: `delete product ${productID} unsuccessfully`});
            } 
            connection.query('DELETE FROM sub_detail WHERE sub_detailID = ?', sub_detailID, function (error, results) {
                if (error){
                    console.log(error);
                    return res.send({error: true, message: `delete product ${productID} unsuccessfully`});
                } 
                connection.query('DELETE FROM material WHERE materialID = ?', materialID, function (error, results) {
                    if (error){
                        console.log(error);
                        return res.send({error: true, message: `delete product ${productID} unsuccessfully`});
                    } 
                    return res.send({error: false, message: `delete product ${productID} successfully`});
                });
            });
        });
        
    });
});

// router.post('/favorite', function (req, res) {
    
// });

// router.post('/addtofavorite', function (req, res) {
    
// });

// router.post('/removefavorite', function (req, res) {
    
// });

// router.post('/carts', function (req, res) {
    
// });

router.post('/addtocart', function (req, res) {
    let cart_item  = req.body.cart_item;
    let productID = cart_item.productID;
    let shopID = cart_item.shopID;
    connection.query('SELECT * FROM product WHERE productID = ?', productID, function (error, results) {
        if (error){
            console.log(error);
            return res.send({error: true, message: `add product ${productID} to cart unsuccessfully`});
        } 
        let product = results[0];
        connection.query('SELECT * FROM cart WHERE cartID = ?', cart.cartID, function (error, results) {
            if (error){
                console.log(error);
                return res.send({error: true, message: `add product ${productID} to cart unsuccessfully`});
            } 
            let cart = results[0];
            if(cart_item.quantity >= product.min_unit) {
                cart.total += product.price;
            }
        });
    });return res.send({error: false, message: `update product ${productID} to cart successfully`});
});

// router.post('/updatecart', function (req, res) {
    
// });

// router.post('/removefromcart', function (req, res) {
    
// });

// router.post('/signin', function (req, res) { //infomation in token
//     let username = req.body.username;
//     let password = req.body.password;
//     connection.query('SELECT * FROM User_management WHERE username = ?', username, function (error, results) {
//         if (error){
//             console.log(error);
//             connection.destroy();
//         }
//         if(!results) {
//             return res.send({error: true, message: `username or password incorrect`});
//         }
//         else if(results[0].password != password) {
//             return res.send({error: true, message: `username or password incorrect`});
//         }
//         else {
//             let sess = req.session;
//             sess.userID = results[0].userInfoID;
//             return res.send({error: false, message: `login successfully`});
//         }
//     });
// });

connection.connect(function(err){
    if(err) throw err;
    console.log("Connected DB: "+process.env.MYSQL_DATABASE);
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Our app is running on port ${ PORT }`);
});

function currenDateTime() {
    let date_ob = new Date();

    let date = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();

    let hours = date_ob.getHours();
    let minutes = date_ob.getMinutes();
    let seconds = date_ob.getSeconds();

    let curDateTime = year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds;
    return curDateTime;
}