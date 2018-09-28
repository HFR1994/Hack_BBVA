const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const PORT = 4200;
const cors = require('cors');
const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB({
    accessKeyId: "AKIAI5WTDTKRPQG4R4JQ",
    secretAccessKey: "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",
    region: "us-east-1"
});

dynamodb.listTables({},function (err,data) {
    if(err) console.log(err, err.stack);
    else console.log(data);
});

const ServerPortRouter = require('./ServerPortRouter');

app.use(cors());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use('/', ServerPortRouter);

app.listen(PORT, function(){
    console.log('Server is running on Port: ',PORT);
});