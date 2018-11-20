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
                var context = JSON.parse(http.responseText).context;
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
                    if(action == "mostrar_eventos") {

                        console.log(context);
                        context['action'] = void(0);

                        $.ajax({
                            url: "/getEventos",
                            type: "GET",
                            data: {"data": context['data']},
                            dataType: "json",
                            contentType: "application/json; charset=utf-8",
                            success: function (data) {
                                context['evento_encontrado'] = "true";
                                var retorno = JSON.stringify(data);
                                var resp = "Evento " + data.nome + ", no local: " + data.local;
                                resp = resp.concat("<br>Mais informações podem ser encontradas em <a href=\"" + data.link + "\" target=\"_blank\">" + data.link + "</a>");

                                console.log(resp);

                                context['resp'] = resp;
                                Api.sendRequest('',context);
                            },
                            error: function (error) {
                                Api.sendRequest('',context);
                            }
                        });
                    }
                    if(action == "zera_variaveis") {
                        var id = context.conversation_id;

                        context = void(0);
                        context['conversation_id'] = id;
                                                
                        Api.sendRequest('',context);
                    }
                    if(action == 'saber-matricula') {
                        var resp = "";
                        context['action'] = void(0);
                        $.ajax({
                            url: "/getMatricula",
                            type: "GET",
                            contentType: "application/json; charset=utf-8",
                            success: function (retorno) {
                                var today = new Date("2018-07-19");
                                if(context['discente'] == 'calouro') {
                                    var infoCalouro = retorno.matricula_calouro;

                                    var dataInicio = new Date(infoCalouro.data_inicio);
                                    var dataFim = new Date(infoCalouro.data_fim);

                                    if(today > dataFim) {
                                        resp = resp.concat("O período de matrícula para calouros deste semestre já passou, a data para o próximo semestre ainda não foi definida.<br>")
                                    }else if(today > dataInicio) {
                                        resp = resp.concat("O período de matrícula de calouros está aberto, e termina dia " + dataFim.getDate() + "/" + (dataFim.getMonth()+1) + "/" + dataFim.getFullYear() + ", não perca o prazo!<br>");
                                        resp = resp.concat("A matrícula é feita na " + retorno.local + ".");
                                    }else{
                                        resp = resp.concat("O período de matrícula ainda não começou. Vai do dia "  + dataInicio.getDate() + "/" + (dataInicio.getMonth()+1) + "/" + dataInicio.getFullYear() + " e vai até " + dataFim.getDate() + "/" + (dataFim.getMonth()+1) + "/" + dataFim.getFullYear() + ". Não perca o prazo!<br>");
                                        resp = resp.concat("A matrícula é feita na " + retorno.local + ".");
                                    }
                                }else{
                                    if (typeof context['matricula'] == 'undefined') {
                                        var infoVeterano1 = retorno.matricula_veterano1;
                                        var infoVeterano2 = retorno.matricula_veterano2;
                                        var infoVeterano3 = retorno.matricula_veterano3;

                                        var dataInicio1 = new Date(infoVeterano1.data_inicio);
                                        var dataFim1 = new Date(infoVeterano1.data_fim);

                                        var dataInicio2 = new Date(infoVeterano2.data_inicio);
                                        var dataFim2 = new Date(infoVeterano2.data_fim);

                                        var dataInicio3 = new Date(infoVeterano3.data_inicio);
                                        var dataFim3 = new Date(infoVeterano3.data_fim);

                                        if(today < dataInicio1) {
                                            resp = resp.concat("A primeira etapa de matrícula se inicia em " + dataInicio1.getDate() + "/" + (dataInicio1.getMonth()+1) + "/" + dataInicio1.getFullYear() + " e vai até " + dataFim1.getDate() + "/" + (dataFim1.getMonth()+1) + "/" + dataFim1.getFullYear() + ". Não perca o prazo!<br>");
                                            resp = resp.concat("A matrícula é feita no portal do aluno: <a href=\"" + infoVeterano1.local + "\" target=\"_blank\">" + infoVeterano1.local + "</a>");
                                        }else if(today < dataFim1){
                                            resp = resp.concat("A primeira etapa de matrícula está aberta e se encerra no dia " + dataFim1.getDate() + "/" + (dataFim1.getMonth()+1) + "/" + dataFim1.getFullYear() + ". Não perca o prazo!<br>");
                                            resp = resp.concat("A matrícula é feita no portal do aluno: <a href=\"" + infoVeterano1.local + "\" target=\"_blank\">" + infoVeterano1.local + "</a>");
                                        }else if(today < dataInicio2) {
                                            resp = resp.concat("A segunda etapa de matrícula se inicia em " + dataInicio2.getDate() + "/" + (dataInicio2.getMonth()+1) + "/" + dataInicio2.getFullYear() + " e vai até " + dataFim2.getDate() + "/" + (dataFim2.getMonth()+1) + "/" + dataFim2.getFullYear() + ". Não perca o prazo!<br>");
                                            resp = resp.concat("A matrícula é feita no portal do aluno: <a href=\"" + infoVeterano2.local + "\" target=\"_blank\">" + infoVeterano2.local + "</a>");
                                        }else if(today < dataFim2){
                                            resp = resp.concat("A segunda etapa de matrícula está aberta e se encerra no dia " + dataFim2.getDate() + "/" + (dataFim2.getMonth()+1) + "/" + dataFim2.getFullYear() + ". Não perca o prazo!<br>");
                                            resp = resp.concat("A matrícula é feita no portal do aluno: <a href=\"" + infoVeterano2.local + "\" target=\"_blank\">" + infoVeterano2.local + "</a>");
                                        }else if(today < dataInicio3) {
                                            resp = resp.concat("A terceira etapa de matrícula se inicia em " + dataInicio3.getDate() + "/" + (dataInicio3.getMonth()+1) + "/" + dataInicio3.getFullYear() + " e vai até " + dataFim3.getDate() + "/" + (dataFim3.getMonth()+1) + "/" + dataFim3.getFullYear() + ". Não perca o prazo!<br>");
                                            resp = resp.concat("A matrícula é feita com o preenchimento do formulário abaixo, que deve ser entregue no colegiado do seu curso.<br>" + 
                                                "<a href=\"" + infoVeterano3.local + "\" target=\"_blank\" class=\"btn btn-info\" role=\"button\">Formulário</a>");
                                        }else if(today < dataFim3){
                                            resp = resp.concat("A terceira etapa de matrícula está aberta e se encerra no dia " + dataFim3.getDate() + "/" + (dataFim3.getMonth()+1) + "/" + dataFim3.getFullYear() + ". Não perca o prazo!<br>");
                                            resp = resp.concat("A matrícula é feita com o preenchimento do formulário abaixo, que deve ser entregue no colegiado do seu curso.<br>" + 
                                                "<a href=\"" + infoVeterano3.local + "\" target=\"_blank\" class=\"btn btn-info\" role=\"button\">Formulário</a>");
                                        }else{
                                            resp = resp.concat("O período de matrícula deste semestre já passou, a data para o próximo semestre ainda não foi definida.<br>");
                                        }
                                    }else{
                                        if(context['matricula'] == "primeira etapa") {
                                            var infoVeterano1 = retorno.matricula_veterano1;
                                            var dataInicio1 = new Date(infoVeterano1.data_inicio);
                                            var dataFim1 = new Date(infoVeterano1.data_fim);

                                            if(today < dataInicio1) {
                                                resp = resp.concat("A primeira etapa de matrícula se inicia em " + dataInicio1.getDate() + "/" + (dataInicio1.getMonth()+1) + "/" + dataInicio1.getFullYear() + " e vai até " + dataFim1.getDate() + "/" + (dataFim1.getMonth()+1) + "/" + dataFim1.getFullYear() + ". Não perca o prazo!<br>");
                                                resp = resp.concat("A matrícula é feita no portal do aluno: <a href=\"" + infoVeterano1.local + "\" target=\"_blank\">" + infoVeterano1.local + "</a>");
                                            }else if(today < dataFim1){
                                                resp = resp.concat("A primeira etapa de matrícula está aberta e se encerra no dia " + dataFim1.getDate() + "/" + (dataFim1.getMonth()+1) + "/" + dataFim1.getFullYear() + ". Não perca o prazo!<br>");
                                                resp = resp.concat("A matrícula é feita no portal do aluno: <a href=\"" + infoVeterano1.local + "\" target=\"_blank\">" + infoVeterano1.local + "</a>");
                                            }else{
                                                resp = resp.concat("A primeira etapa de matrícula já terminou. :(");
                                            }
                                        } else if (context['matricula'] == "segunda etapa") {
                                            var infoVeterano2 = retorno.matricula_veterano2;
                                            var dataInicio2 = new Date(infoVeterano2.data_inicio);
                                            var dataFim2 = new Date(infoVeterano2.data_fim);

                                            if(today < dataInicio2) {
                                                resp = resp.concat("A segunda etapa de matrícula se inicia em " + dataInicio2.getDate() + "/" + (dataInicio2.getMonth()+1) + "/" + dataInicio2.getFullYear() + " e vai até " + dataFim2.getDate() + "/" + (dataFim2.getMonth()+1) + "/" + dataFim2.getFullYear() + ". Não perca o prazo!<br>");
                                                resp = resp.concat("A matrícula é feita no portal do aluno: <a href=\"" + infoVeterano2.local + "\" target=\"_blank\">" + infoVeterano2.local + "</a>");
                                            }else if(today < dataFim2){
                                                resp = resp.concat("A segunda etapa de matrícula está aberta e se encerra no dia " + dataFim2.getDate() + "/" + (dataFim2.getMonth()+1) + "/" + dataFim2.getFullYear() + ". Não perca o prazo!<br>");
                                                resp = resp.concat("A matrícula é feita no portal do aluno: <a href=\"" + infoVeterano2.local + "\" target=\"_blank\">" + infoVeterano2.local + "</a>");
                                            }else{
                                                resp = resp.concat("A segunda etapa de matrícula já terminou. :(");
                                            }
                                        }else{
                                            var infoVeterano3 = retorno.matricula_veterano3;
                                            var dataInicio3 = new Date(infoVeterano3.data_inicio);
                                            var dataFim3 = new Date(infoVeterano3.data_fim);

                                            if(today < dataInicio3) {
                                                resp = resp.concat("A terceira etapa de matrícula se inicia em " + dataInicio3.getDate() + "/" + (dataInicio3.getMonth()+1) + "/" + dataInicio3.getFullYear() + " e vai até " + dataFim3.getDate() + "/" + (dataFim3.getMonth()+1) + "/" + dataFim3.getFullYear() + ". Não perca o prazo!<br>");
                                                resp = resp.concat("A matrícula é feita com o preenchimento do formulário abaixo, que deve ser entregue no colegiado do seu curso.<br>" + 
                                                    "<a href=\"" + infoVeterano3.local + "\" target=\"_blank\" class=\"btn btn-info\" role=\"button\">Formulário</a>");
                                            }else if(today < dataFim3){
                                                resp = resp.concat("A terceira etapa de matrícula está aberta e se encerra no dia " + dataFim3.getDate() + "/" + (dataFim3.getMonth()+1) + "/" + dataFim3.getFullYear() + ". Não perca o prazo!<br>");
                                                resp = resp.concat("A matrícula é feita com o preenchimento do formulário abaixo, que deve ser entregue no colegiado do seu curso.<br>" + 
                                                    "<a href=\"" + infoVeterano3.local + "\" target=\"_blank\" class=\"btn btn-info\" role=\"button\">Formulário</a>");
                                            }else{
                                                resp = resp.concat("A terceira etapa de matrícula já terminou. :(");
                                            }
                                        }
                                    }
                                }
                                context["resp"] = resp;
                                Api.sendRequest('',context);
                            },
                            error: function (error) {
                                console.log(error);
                                Api.sendRequest('',context);
                            }
                        });


                    }
                    if(action == "mostrar_cardapio") {
                        var data = new Date();
                        console.log(data);
                        var str_data = data.getFullYear() + "-" + (data.getMonth()+1) + "-" + (data.getDate());
                        $.ajax({
                            url: "/cardapio",
                            type: "GET",
                            data: {"tipo": context['ru'],
                                    "data": str_data },
                            contentType: "application/json; charset=utf-8",
                            success: function (data, textStatus, xhr) {
                                try{
                                    var resp = "";
                                    if(typeof context['ru'] === "undefined" || context['ru'].match("Almo")) {
                                        resp = resp.concat("O cardápio do almoço é: <br>");
                                    }else{
                                        resp = resp.concat("O cardápio da janta é: <br>");
                                    }
                                    console.log(data);
                                    data.split("\n").forEach(function(item) {
                                        if(item.match("Salada") || item.match("Prato") || item.match("Opção") || item.match("Acompanhamento") || item.match("Guarnição") || item.match("Sobremesa")) {
                                            resp = resp.concat(" <b> ", item, " </b> <br> ");
                                        }else if(item !== "" && !item.match("Janta") && !item.match("Almo") && item !== "\n"){
                                            resp = resp.concat(item, "<br>");
                                        }
                                    });
                                }catch(err) {
                                    resp = "Ocorreu um erro, favor reportar toda a conversa.\n" + err
                                }
                                context['resp'] = resp;

                                Api.sendRequest('',context);
                            },
                            error: function (xhr, textStatus) {
                                context['ru'] = null;
                                console.log("erro");
                                console.log(xhr.status);
                                console.log(textStatus);
                                context['resp'] = xhr.responseText;
                                Api.sendRequest('',context);
                            }
                        });
                        context['action'] = void(0);
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

// var context;
// var latestResponse = Api.getResponsePayload();
// if (latestResponse) context = latestResponse.context;
