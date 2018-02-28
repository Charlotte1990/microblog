'use strict'

$(function () {
  $('[data-toggle="offcanvas"]').on('click', function () {
    $('.offcanvas-collapse').toggleClass('open')
  });

  $('.navbar-nav a').on('click', function () {
    $('.navbar-nav').find('li.active').removeClass('active');
    $(this).parent('li').addClass('active');
  });

  $('.alert').delay(300).fadeIn('normal', function () {
    $(this).delay(2500).fadeOut();
  });

})





