$(function () {
  var $window = $(window);
  var $body = $(document.body);
  var $entries = $('#entries');
  var $gallery = $('#gallery');
  var $closeButton = $('#close-button');

  var snaps = [];
  var _currentSnap = null;

  var keysDown = {};
  var scrollTop;
  var scrollDisabled = false;

  var GEN_II_START = 152;
  var GEN_III_START = 252;
  var UNOBTAINABLE = [
    // Mythical
    151, 251, 385, 386,
    // Unreleased Legendary
    377, 378, 379,
    // Babies
    172, 173, 174, 175, 236, 238, 239, 240, 298, 360,
    // Evolution items
    182, 186, 192, 199, 208, 212, 230, 233,
    // Eeveelotuions
    196, 197,
    // Unreleased Johto
    235,
    // Hoenn withheld evolutions
    254, 257, 260, 266, 267, 268, 269, 272, 275, 282,
    289, 295, 308, 310, 321, 330, 334, 350, 373,
    376,
    // Unreleased Hoenn
    290, 291, 292, 327, 352, 366, 367, 368
  ];

  $.get('snaps/snaps.json')
    .done(function (data) {
      for (var i = 0; i < data.length; i++) {
        snaps.push(data[i].substring(0, 3));
      }
      $body.removeClass('loading');
      loadSnaps();
    })
    .fail(function () {
      alert('Failed to load Photódex information!');
    });

  function loadSnaps() {
    $('#snapped-count').text(snaps.length);

    var highestSnap = snaps[snaps.length - 1];
    for (var i = 1; i <= highestSnap; i++) {
      var number = i.toString();
      while (number.length < 3) {
        number = '0' + number;
      }
      var generationClass = i < GEN_II_START ? 'gen-i' : i < GEN_III_START ? 'gen-ii' : 'gen-iii';
      var entry = buildEntry(number).addClass(generationClass);
      if (UNOBTAINABLE.indexOf(i) !== -1) {
        entry.addClass('unobtainable');
      }
      $entries.append(entry);
    }

    // Hacky way to ensure that last row of flex aligns to grid.
    // http://stackoverflow.com/a/22018710
    for (var i = 0; i < 20; i++) {
      $('<div/>', { "class": 'entry placeholder' }).appendTo($entries);
    }

    $window.hashchange();
  }

  $gallery.click(function (e) {
    if (e.target !== this) return;
    hideGallery();
  });

  $closeButton.click(hideGallery);

  $window.swiperight(slideToPreviousSnap)
    .swipeleft(slideToNextSnap)
    .keydown(function (e) {
      if (keysDown[e.keyCode]) return;
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      keysDown[e.keyCode] = true;
      switch (e.keyCode) {
        case 37: // left arrow
          return slideToPreviousSnap();
        case 39: // right arrow
          return slideToNextSnap();
        case 27: // escape
          return hideGallery();
      }
    }).keyup(function (e) {
      keysDown[e.keyCode] = false;
    }).hashchange(function () {
      var snap = getSnapFromHash();
      if (_currentSnap === snap) return;
      if (snaps.indexOf(snap) !== -1) {
        showGalleryImage(snap);
      } else {
        hideGallery();
      }
    });

  function buildEntry(number) {
    var $entry = $('<div/>', {
      id: 'entry-' + number,
      "class": 'entry'
    });
    if (snaps.indexOf(number) !== -1) {
      addSnap($entry, number);
    } else {
      $entry.text(number);
    }
    return $entry;
  }

  function addSnap($entry, number) {
    var $img = $('<img/>');
    $img.appendTo($entry);
    $img.attr('src', 'snaps/thumbs/' + number + '.jpg');
    $img.click(function () {
      showGalleryImage(number);
    });
  }

  function showGalleryImage(number) {
    setCurrentSnap(number);
    setGalleryImage('current', _currentSnap);
    setGalleryImage('previous', getPreviousSnap());
    setGalleryImage('next', getNextSnap());
    disableScroll();
    $gallery.addClass('active');
  }

  function hideGallery() {
    setCurrentSnap(null);
    $('.gallery-image').attr('src', '');
    enableScroll();
    $gallery.removeClass('active');
  }

  function slideToPreviousSnap() {
    if (!galleryActive()) return;
    var previousSnap = getPreviousSnap();
    if (!previousSnap) {
      var current = $('.current');
      current.removeClass('current').addClass('next');
      setTimeout(function() {
        current.removeClass('next').addClass('current');
      }, 100);
      return;
    }
    setCurrentSnap(previousSnap);
    $('.next').remove();
    $('.current').removeClass('current').addClass('next');
    $('.previous').removeClass('previous').addClass('current');
    $('<img/>', { "class": 'gallery-image previous' }).prependTo($gallery);
    setGalleryImage('previous', getPreviousSnap());
  }

  function slideToNextSnap() {
    if (!galleryActive()) return;
    var nextSnap = getNextSnap();
    if (!nextSnap) {
      var current = $('.current');
      current.removeClass('current').addClass('previous');
      setTimeout(function() {
        current.removeClass('previous').addClass('current');
      }, 100);
      return;
    }
    setCurrentSnap(nextSnap);
    $('.previous').remove();
    $('.current').removeClass('current').addClass('previous');
    $('.next').removeClass('next').addClass('current');
    $('<img/>', { "class": 'gallery-image next' }).prependTo($gallery);
    setGalleryImage('next', getNextSnap());
  }

  function galleryActive() {
    return $gallery.hasClass('active');
  }

  function getPreviousSnap() {
    var previousIndex = snaps.indexOf(_currentSnap) - 1;
    return snaps[previousIndex];
  }

  function getNextSnap() {
    var nextIndex = snaps.indexOf(_currentSnap) + 1;
    return snaps[nextIndex];
  }

  function setCurrentSnap(snap) {
    _currentSnap = snap;
    if (snap) {
      history.replaceState(null, null, '#' + snap);
    } else {
      clearHash();
    }
  }

  function setGalleryImage(position, number) {
    if (number === undefined) return;
    $('.' + position + '.gallery-image').attr('src', 'snaps/gallery/' + number + '.jpg');
  }

  function disableScroll() {
    if (scrollDisabled) return;
    scrollTop = $window.scrollTop();
    $body.addClass('no-scroll').css({ top: -scrollTop });
    scrollDisabled = true;
  }

  function enableScroll() {
    if (!scrollDisabled) return;
    $body.removeClass('no-scroll');
    $window.scrollTop(scrollTop);
    scrollDisabled = false;
  }

  function getSnapFromHash() {
    return location.hash.replace(/^#/, '') || null;
  }

  function clearHash(number) {
    if (!getSnapFromHash()) return;
    history.replaceState(null, null, location.pathname);
    $window.hashchange();
  }
});