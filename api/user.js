"use strict";

const mongoose = require("mongoose");
const supergoose = require('supergoose');
const auth = require("./auth");

const UserSchema = require("./../model/user.js");
UserSchema.plugin(supergoose); // findOrCreate

const User = mongoose.model("User", UserSchema);

exports.findOrCreate = function (user) {
    User.findOrCreate({user: user}, () => undefined);
};

// GET /api/user
// parameters: req.body.user
exports.getUserReq = function (req, res, next) {
    auth.verifyReqTokenAsync(req, res, next, undefined).then((accInfo) => {

        const reqParam = req.query;

        // filter user is provided & requester is student => must ask about yourself
        if (
            reqParam.user
            && accInfo.accType === auth.accountTypes.STUDENT
            && !(reqParam.user === accInfo.user)
        ) {
            res.status(403).send({});
            return;
        }

        // filter user is not provided & requester is student => should got self
        if (
            !reqParam.user
            && accInfo.accType === auth.accountTypes.STUDENT
        ) {
            reqParam.user = accInfo.user;
        }

        const mongoFilters = {};
        reqParam.user && (mongoFilters.user = reqParam.user);

        User.find(
            mongoFilters,
            (err, docs) => {
                if (err) {
                    res.status(500).send({});
                    console.log(err);
                    return;
                }

                res.status(200).send(docs);
            }
        );
    }, (err) => {
        console.log("AssertionError(U0, " + err + ")");
    })
};


// POST /api/user/update
// parameters: req.body.user, req.body.name, req.body.surname, req.body.mobile, req.body.email,
// req.body.wantEmail, req.body.wantSms
exports.postUserUpdateReq = function (req, res, next) {
    auth.verifyReqTokenAsync(req, res, next, auth.accountTypes.STUDENT).then((accInfo) => {

        const reqParam = req.body;

        // filter user is required
        if (
            !reqParam.user
        ) {
            res.status(400).send({});
            return;
        }

        // can only update self
        if (
            reqParam.user !== accInfo.user
        ) {
            res.status(403).send({});
            return;
        }

        // mongo params
        const mongoFilters = {};
        reqParam.user && (mongoFilters.user = reqParam.user);

        const mongoUpdate = {};
        reqParam.user && (mongoUpdate.user = reqParam.user);
        (mongoUpdate.name = reqParam.name);
        (mongoUpdate.surname = reqParam.surname);
        (mongoUpdate.mobile = reqParam.mobile);
        (mongoUpdate.email = reqParam.email);
        (mongoUpdate.wantEmail = reqParam.wantEmail);
        (mongoUpdate.wantSms = reqParam.wantSms);

        // verify request is proper
        const newUser = new User(mongoUpdate);
        const error = newUser.validateSync(undefined);
        if (error) {
            res.status(400).send({});
            return;
        }

        // update
        User.findOneAndUpdate(
            mongoFilters,
            mongoUpdate,
            {},
            (err, doc) => {
                if (err) {
                    res.status(500).send({});
                    console.log(err);
                    return;
                }

                if (doc) {
                    reqParam.user && (doc.user = reqParam.user);
                    (doc.name = reqParam.name);
                    (doc.surname = reqParam.surname);
                    (doc.mobile = reqParam.mobile);
                    (doc.email = reqParam.email);
                    (doc.wantEmail = reqParam.wantEmail);
                    (doc.wantSms = reqParam.wantSms);
                    res.status(200).send(doc);
                } else {
                    res.status(400).send({});
                }
            });
    }, (err) => {
        console.log("AssertionError(U1, " + err + ")");
    })
};

