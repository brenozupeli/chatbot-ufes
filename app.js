/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var express = require('express'); // app server
var bodyParser = require('body-parser'); // parser for post requests
var Conversation = require('watson-developer-cloud/conversation/v1'); // watson sdk
const request = require('request');
const http = require('http');
var querystring = require('querystring');
var app = express();
var JsonDB = require('node-json-db');
var cheerio = require('cheerio');

// Bootstrap application settings
app.use(express.static('./public')); // load UI from public folder
// app.use(bodyParser.urlencoded({
//   extended: true
// }));
app.use(bodyParser.json());

var db = new JsonDB("dataBase", true, true);

// Create the service wrapper
var conversation = new Conversation({
  // If unspecified here, the CONVERSATION_USERNAME and CONVERSATION_PASSWORD env properties will be checked
  // After that, the SDK will fall back to the bluemix-provided VCAP_SERVICES environment property
  // username: '<username>',
  // password: '<password>',
  // url: 'https://gateway.watsonplatform.net/conversation/api',
  version_date: Conversation.VERSION_DATE_2017_04_21
});

app.post('/api/message', function(req, res) {
  var workspace = process.env.WORKSPACE_ID || '<workspace-id>';
  if (!workspace || workspace === '<workspace-id>') {
    return res.json({
      'output': {
        'text': 'The app has not been configured with a <b>WORKSPACE_ID</b> environment variable. Please refer to the ' + '<a href="https://github.com/watson-developer-cloud/conversation-simple">README</a> documentation on how to set this variable. <br>' + 'Once a workspace has been defined the intents may be imported from ' + '<a href="https://github.com/watson-developer-cloud/conversation-simple/blob/master/training/car_workspace.json">here</a> in order to get a working application.'
      }
    });
  }
  var payload = {
    workspace_id: workspace,
    context: req.body.context || {},
    input: req.body.input || {}
  };

  // Send the input to the conversation service
  conversation.message(payload, function(err, data) {
    if (err) {
      return res.status(err.code || 500).json(err);
    }
    return res.json(updateMessage(payload, data));
  });
});

/**
 * Updates the response text using the intent confidence
 * @param  {Object} input The request to the Conversation service
 * @param  {Object} response The response from the Conversation service
 * @return {Object}          The response with the updated message
 */
function updateMessage(input, response) {
  var responseText = null;
  if (!response.output) {
    response.output = {};
  } else {
    return response;
  }
  if (response.intents && response.intents[0]) {
    var intent = response.intents[0];
    // Depending on the confidence of the response the app can return different messages.
    // The confidence will vary depending on how well the system is trained. The service will always try to assign
    // a class/intent to the input. If the confidence is low, then it suggests the service is unsure of the
    // user's intent . In these cases it is usually best to return a disambiguation message
    // ('I did not understand your intent, please rephrase your question', etc..)
    if (intent.confidence >= 0.75) {
      responseText = 'I understood your intent was ' + intent.intent;
    } else if (intent.confidence >= 0.5) {
      responseText = 'I think your intent was ' + intent.intent;
    } else {
      responseText = 'I did not understand your intent';
    }
  }
  response.output.text = responseText;
  return response;
}

app.get('/getEventos', function(req, res){
  console.log(req.query.data);
  try {
    var data = db.getData("/eventos/" + req.query.data);

    res.status(200);
    res.send(data);
  } catch(error) {
      console.error(error);
      res.status(400);
      res.send("Erro ao encontrar eventos");
  };
});

app.get('/getMatricula', function(req, res){
  try {
    var data = db.getData("/calendario_academico");

    res.status(200);
    res.send(data);
  } catch(error) {
      console.error(error);
      res.status(400);
      res.send("Erro ao encontrar eventos");
  };
});

app.post('/cadastrar', function(req, res){
  console.log(req.body.dados);
  try {
    db.push("/" + req.body.tipo + "/" + req.body.id, req.body.dados);

    res.status(200);
    res.send("Cadastro realizado");
  } catch(error) {
      console.error(error);
      res.status(400);
      res.send("Erro ao cadastrar");
  };
});

app.get("/cardapio", function(req, res) {
  var url = "http://www.ru.ufes.br/cardapio/";
  var achou = false;
  var resp = null;
  var sair = false;
  console.log(req.query.data + " " + req.query.tipo);
  request(url+req.query.data, function(err, response, html) {
    if(!err) {
      var $ = cheerio.load(html);

      $('.views-field').filter(function(){
        if(!sair) {
          var data = $(this);
          var cardapio = data.children().first().text();
          if(achou) {
            achou = false;
            sair = true;
            resp = cardapio;
          }
          if(cardapio.match(req.query.tipo)) {
            achou = true;
          }
        }
      }); 
    }
    if(resp != null) {
      console.log("Achou " + resp);
      res.status(200);
      res.send(resp);
    }else{
      console.log("Não");
      res.status(400);
      res.send("O cardápio ainda não está disponível.");
    }
  });
});

module.exports = app;
