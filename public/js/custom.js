$(document).ready(function(){

	$(document).on('click', '#contentParent .chat-header', function () {
		$("#contentParent").addClass("closed-chat");
	});
	$(document).on('click', '#contentParent.closed-chat', function () {
		$("#contentParent").removeClass("closed-chat");
	});
});


