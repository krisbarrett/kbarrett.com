$( document ).ready(function() {
   // set active nav item
	var path = window.location.pathname;
	if(path == "/")
	{
		$('li#home').addClass("active");
	}
	else if(path == "/blog.html")
	{
		$('li#blog').addClass("active");
	}
	else if(path == "/projects.html")
	{
		$('li#projects').addClass("active");
	}

   // set sidebar class depending on width
   var resizeEvent = function() {
      var width = $(window).width();
      var sidebar = $('div#sidebar');
      if(width < 992)
      {
         sidebar.removeClass("sidebar");
         sidebar.addClass("sidebar-small");
      }
      else
      {
         sidebar.removeClass("sidebar-small");
         sidebar.addClass("sidebar");
      }
   }
   resizeEvent();
   $( window ).resize(function() {
      resizeEvent();
   });
});