// The Api module is designed to handle all interactions with the server
var map;
var lat, long, endereco;

var Api = (function() {
    var requestPayload;
    var responsePayload;
    var messageEndpoint = '/api/message';

    // Publicly accessible methods defined
    return {
        sendRequest: sendRequest,

        // The request/response getters/setters are defined here to prevent internal methods
        // from calling the methods without any of the callbacks that are added elsewhere.
        getRequestPayload: function() {
            return requestPayload;
        },
        setRequestPayload: function(newPayloadStr) {
            requestPayload = JSON.parse(newPayloadStr);
        },
        getResponsePayload: function() {
            return responsePayload;
        },
        setResponsePayload: function(newPayloadStr) {
            responsePayload = JSON.parse(newPayloadStr);
        }
    };

    // Send a message request to the server
    function sendRequest(text, context) {
        // Build request payload
        var payloadToWatson = {};
        if (text) {
            payloadToWatson.input = {
                text: text
            };
        }
        if (context) {
            payloadToWatson.context = context;
        }

        function scrollToChatBottom() {
            var scrollingChat =  document.getElementById("scrollingChat");
            scrollingChat.scrollTop = scrollingChat.scrollHeight;
        }

        function showTypingGif(visible,context){
            if (visible){
                var typing = document.createElement("img");
                typing.setAttribute("id", "typing");
                typing.setAttribute("src", "img/loader.gif");
                document.getElementById("scrollingChat").appendChild(typing);
                //scrollToChatBottom();
            } else {
                if(document.getElementById("typing")) document.getElementById("typing").outerHTML = '';
                context.category = null;
                Api.sendRequest('',context);
            }
        }

        // Built http request
        var http = new XMLHttpRequest();
        http.open('POST', messageEndpoint, true);
        http.setRequestHeader('Content-type', 'application/json');
        http.onreadystatechange = function() {
            if (http.readyState === 4 && http.status === 200 && http.responseText) {
                var action = JSON.parse(http.responseText).context.action;
                Api.setResponsePayload(http.responseText);

                if(typeof action !== "undefined" && action != "none") {
                    //Quando abrir modais, esperar requisições e coisas do tipo, setar action para "espera" e assim chat fica "travado"
                    if (action == "wait"){
                        showTypingGif(true,JSON.parse(http.responseText).context);
                        setTimeout(function(){
                            showTypingGif(false,JSON.parse(http.responseText).context);
                        }, 4000);
                    } else {
                        $("#textInput").prop("disabled", false);
                        $("#textInput").attr("placeholder", "Escreva sua mensagem...");
                        $("#textInput").get(0).focus();
                    }

                    if(action == "fecha_chat"){
                        setTimeout(function(){
                            for(var i=document.getElementsByClassName('segments load').length -1; i>= 0;i--){
                                document.getElementsByClassName('segments load')[i].remove();
                            }
                            $("#contentParent").addClass("closed-chat");

                            Api.sendRequest('',null);
                        }, 1500);
                    }
                    // if(action == "mostrar_eventos") {
                    //     console.log("---------------");
                    //     console.log(context);


                    //     Api.sendRequest('',null);
                    // }
                    console.log(context);
                    if(action == 'teste') {
                        console.log("---------------------- TESTE  ");
                        Api.sendRequest('resposta', context);
                    }

                }
            }
        };

        var params = JSON.stringify(payloadToWatson);
        // Stored in variable (publicly visible through Api.getRequestPayload)
        // to be used throughout the application
        if (Object.getOwnPropertyNames(payloadToWatson).length !== 0) {
            Api.setRequestPayload(params);
        }

        // Send request
        http.send(params);
    }
}());