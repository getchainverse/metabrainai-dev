(function() {
  $('input').focus(function(){
    $(this).parents('.form-group').addClass('movelabel');
  });

  $('input').blur(function(){
    var inputValue = $(this).val();
    if ( inputValue == "" ) {
      $(this).removeClass('filled');
      $(this).parents('.form-group').removeClass('movelabel');  
    } else {
      $(this).addClass('filled');
    }
  });

  $(document).ready(function() {
    $(".form-group").addClass("movelabel");

    const myTimeout = setTimeout(loading, 2000);

    function loading() {
        $(".loading").css("z-index", -1);
    }
  });

  let pass = document.getElementById('pass');

  if (!pass) {
    // If the variable is undefined, assign it
    pass = document.getElementById('pass');
  }

  const inputHandler = function(e) {
    $(".wrong-pass").hide();
    if(e.target.value == '')
      $(".unlocksubmit").removeClass("entered");
    else
      $(".unlocksubmit").addClass("entered");
  }

  if (pass) {
    pass.addEventListener('input', inputHandler);
  }

  $(".unlocksubmit").click(function() {
    if($(".unlocksubmit").hasClass("entered"))
      $(".wrong-pass").show();
  });

  // $(document).click(function(event) {
  //   if (!$(event.target).closest(".modalcontainer").length) {
  //     $("body").find(".modalcontainer").addClass("invisible");
  //   }
  // })

})();