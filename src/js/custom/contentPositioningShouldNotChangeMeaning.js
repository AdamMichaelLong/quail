quail.contentPositioningShouldNotChangeMeaning = function() {
	//Look for absolute positioned elements that are being put into grids or columns
	var positions = ['top', 'left', 'right', 'bottom'];
	var coordinates = {};
	var failed = false;
	quail.html.find('*:has(*:quailCss(position=absolute))').each(function() {
		coordinates = {top: {}, left: {}, right: {}, bottom: {}};
		failed = false;
		var $container = $(this);
		$container.find('li, ul, dd, dt').filter(':quailCss(position=absolute)').each(function() {
			for(var i = 0; i < positions.length; i++) {
				if(typeof $(this).css(positions[i]) !== 'undefined' && $(this).css(positions[i]) !== 'auto') {
					if(typeof coordinates[positions[i]][$(this).css(positions[i])] === 'undefined') {
						coordinates[positions[i]][$(this).css(positions[i])] = 0;
					}
					coordinates[positions[i]][$(this).css(positions[i])]++;
				}
			}
		});
		
		$.each(positions, function() {
			$.each(coordinates[this], function() {
				if(this > 2 && !failed) {
					failed = true;
					quail.testFails('contentPositioningShouldNotChangeMeaning', $container);
				}
			});
		});
	});
};