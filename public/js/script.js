var $grid = $('.grid').masonry({
	// options
	itemSelector: '.grid-item',
	columnWidth: 200,
	gutter: 15
});

$grid.imagesLoaded().progress(function() {
	$grid.masonry('layout');
});