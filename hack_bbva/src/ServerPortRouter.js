// ServerPortRouter.js

const express = require('express');
const ServerPortRouter = express.Router();
const shit = require('./deleteShit');
const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB({
    accessKeyId: "AKIAI5WTDTKRPQG4R4JQ",
    secretAccessKey: "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",
    region: "us-east-1"
});

const sleep = require('system-sleep');

const PersonalityInsightsV3 = require('watson-developer-cloud/personality-insights/v3');

//set IBM cloud credentials in this section
const personalityInsights = new PersonalityInsightsV3({
    version_date: '2017-10-13',
    username: '2272b003-3190-4540-b0d1-af2b3dca258f',
    password: 'QZtoi6l1zRdL'
});

let VisualRecognitionV3 = require('watson-developer-cloud/visual-recognition/v3');

let visualRecognition = new VisualRecognitionV3({
    version: '2018-03-19',
    iam_apikey: 'D2GyPJNCTR1KSjicSe2G1axq0BdsmKZcRYSeZnGI4BJw'
});

function getUser(profile){

    if(JSON.stringify(profile).includes("Héctor")){
        return 1
    }else if(JSON.stringify(profile).includes("Isaac")){
        return 2
    }else if(JSON.stringify(profile).includes("Salinas")){
        return 3
    }else{
        return 4
    }

}

ServerPortRouter.route('/personality').post(function (req, res) {

    const num = getUser(req.body.user);
    //insertUser(req.body.source,JSON.parse(req.body.user),num);
    let cont = JSON.stringify(req.body);

    let profileParams = {
        // Get the content from the JSON file.

        content: cont,
        content_type: 'text/plain',
        consumption_preferences: true,
        content_language: 'es',
        accept_language: 'es',
        csv_headers: true,
        raw_scores: true
    };
    personalityInsights.profile(profileParams, function(error, profile) {
        if (error) {
            console.log(error);
        } else {
            console.log({... shit.cleansing(profile), user: {N: String(num)}, id: {S:cont.id}});
            dynamodb.putItem({
                Item:{... shit.cleansing(profile), user: {N: String(num)}, id: {S:cont.id}},
                ReturnConsumedCapacity: "TOTAL",
                TableName: "idep"
            }, function (err, body, headers) {
                if (err) {
                    return console.log('[idep.insert]', err);
                }
            });
            res.json("Listo Termine de cargar");
        }
    });

});

function insertUser(type, profile, num){
    switch (type){
        case "Facebook":
            dynamodb.putItem({
                Item:{... profile, user: num, id: profile.id },
                ReturnConsumedCapacity: "TOTAL",
                TableName: "facebook"
            }, function (err, body, headers) {
                if (err) {
                    return console.log('[Facebook.insert]', err);
                }
            });
            break;
        case "Twitter":
            delete profile.__v;
            dynamodb.putItem({
                Item:{... profile, user: num, id: profile._id },
                ReturnConsumedCapacity: "TOTAL",
                TableName: "twitter"
            }, function (err, body, headers) {
                if (err) {
                    return console.log('[Twitter.insert]', err);
                }
            });
            break;
        case "Instagram":
            dynamodb.putItem({
                Item:{... profile, user: num, id: profile.id },
                ReturnConsumedCapacity: "TOTAL",
                TableName: "instagram"
            }, function (err, body, headers) {
                if (err) {
                    return console.log('[Instagram.insert]', err);
                }
            });
            break;
    }
}

ServerPortRouter.route('/').get(function (req, res) {

});

ServerPortRouter.route('/visual').post(function (req, res) {

    const num = getUser(req.body.user);
    //insertUser(req.body.source,JSON.parse(req.body.user),num);

    const images = JSON.parse(req.body.data);

    images.map((e, index) => {
        let params = {
            url: e.link,
        };

        visualRecognition.classify(params, function(err, response) {
            if (err)
                console.log(err);
            else {
                const value = {};
                value.url = {S:response.images[0].resolved_url};

                const classifier = response.images[0].classifiers[0].classes;

                let obj={};
                classifier.map((e) => {
                    obj={... obj, [e.class]:{N: String(e.score)}};
                    return null;
                });

                value.classifier = {M: obj};
                value.user = {N: String(num)};
                value.id = {S: e.id};

                dynamodb.putItem({
                    Item: value,
                    ReturnConsumedCapacity: "TOTAL",
                    TableName: "images"
                }, function (err, body, headers) {
                    if (err) {
                        return console.log('[Twitter.insert]', err);
                    }
                });

            }
        });
    });
    res.json("Listo Termine de cargar");
});

module.exports = ServerPortRouter;