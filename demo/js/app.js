/*
 *  Inwersja kolorów
 */
var invertColors = function(imgData) {
	var w = null, h = null, imgArr = null;
	w = imgData.width;
	h = imgData.height;
	imgArr = imgData.data;
	for (var i = 0; i < h; i++) {
		for (var j = 0; j < w; j++) {
			var pixel = (i * w + j) * 4;
			imgArr[pixel] = 255 - imgArr[pixel];
			imgArr[pixel + 1] = 255 - imgArr[pixel + 1];
			imgArr[pixel + 2] = 255 - imgArr[pixel + 2];
		}
	}
};

/*
 * Odczytanie danych dla pixela przy najechaniu myszką
 */
var readPixels = function(imgData) {
	$('.workspace').hover(function() {
		$(this).mousemove(function(e) {
			var x, y;
			x = e.pageX - this.offsetLeft;
			y = e.pageY - this.offsetTop;
			$('#pixel-data .x_y').html('[' + x + ',' + y + ']');
			$('#pixel-data .red').html(imgData.data[(y * imgData.width + x) * 4]);
			$('#pixel-data .green').html(imgData.data[(y * imgData.width + x) * 4 + 1]);
			$('#pixel-data .blue').html(imgData.data[(y * imgData.width + x) * 4 + 2]);
			$('#pixel-data .alpha').html(imgData.data[(y * imgData.width + x) * 4 + 3]);
		});
	}, function() {
		$('#pixel-data .x_y').html('[ - , - ]');
		$('#pixel-data .red').html(' - ');
		$('#pixel-data .green').html(' - ');
		$('#pixel-data .blue').html(' - ');
		$('#pixel-data .alpha').html(' - ');
	});
};
/*
 *  Funkacja sprawdzająca prwidłowość danych dla RGB - 0-255
 */
var checkRGB = function(value) {
	if (value < 0) {
		return 0;
	} else if (value > 255) {
		return 255;
	} else {
		return value;
	}
};
/*
 *  Funkcja stosująca filtr do danego obrazu Filtr jest tablicą będący maską w przypadku analizy
 */
var attachFilter = function(imgData, filter) {
	var w = null, h = null, imgArr = null, imgTempArr = [];
	w = imgData.width;
	h = imgData.height;
	imgArr = imgData.data;

	//obliczenie dla maski
	var mask_width = Math.sqrt(filter.length);
	var mask_offset = (mask_width - 1) / 2;

	for (var i = mask_offset; i < h - mask_offset; i++) {// dla każdego wiersza - wyłączając maskę
		for (var j = mask_offset; j < w - mask_offset; j++) {// każdy x - wyłączając maskę
			//zastosowanie filtru dla każdego pixela z osobna
			var pixel_i = (i * w + j) * 4;
			var f_index = 0, r = 0, g = 0, b = 0, f_sum = 0;
			//obliczenia przeprowadzane dla każdej maski - wyliczanie średniej dla filtra
			for (var k = -mask_offset; k <= mask_offset; k++) {
				for (var l = -mask_offset; l <= mask_offset; l++) {
					var mask_i = ((i + k) * w + (j + l)) * 4;
					r += (filter[f_index] * imgArr[mask_i]);
					g += (filter[f_index] * imgArr[mask_i + 1]);
					b += (filter[f_index] * imgArr[mask_i + 2]);
					f_sum += filter[f_index];
					f_index++;
				}
			}
			f_sum = f_sum || 1;
			imgTempArr[pixel_i] = checkRGB(Math.floor(r / f_sum));
			imgTempArr[pixel_i + 1] = checkRGB(Math.floor(g / f_sum));
			imgTempArr[pixel_i + 2] = checkRGB(Math.floor(b / f_sum));
		}
	}

	// zastosowanie zmian do imageData
	for (var m = mask_offset; m < h - mask_offset; m++) {
		for (var n = mask_offset; n < w - mask_offset; n++) {
			var pixel_im = (m * w + n) * 4;
			imgArr[pixel_im] = imgTempArr[pixel_im];
			imgArr[pixel_im + 1] = imgTempArr[pixel_im + 1];
			imgArr[pixel_im + 2] = imgTempArr[pixel_im + 2];
		}
	}
};



var ctx, canvas, img;
$(function() {// wykonanie funkcji po wczytaniu całego dokumentu

	canvas = document.getElementById('image-can');

	//sprawdzenie czy przeglądarka obsługuje HTML5 element canvas
	if (!canvas.getContext) {
		alert('Ta przeglądarka nie posiada obsługi elementów Canvas \n brak zgodności z HTML5');
	}

	ctx = canvas.getContext('2d');
	img = new Image();
	//załadowanie obrazu do pamięci przeglądarki
	img.addEventListener('load', function() {
		var imgData;
		canvas.width = this.width;
		canvas.height = this.height;
		$('.workspace').width(canvas.width);
		$('.workspace').height(canvas.height);

		ctx.drawImage(img, 0, 0);

		imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

		//wywołanie inwersji kolorów dla danego obrazka
		$('#invert-filter').click(function() {
			// funkcja inwersji kolorów - edycja imgData
			invertColors(imgData);
			//odświerzenie widoku - wyczyszczenie Context
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			// ponowne wczytanie danych do context
			ctx.putImageData(imgData, 0, 0);
		});

		// wywołanie filtra dolnoprzepustowego
		$('#low-filter').click(function() {
			var filter = [1, 1, 1, 1, 1, 1, 1, 1, 1];
			attachFilter(imgData, filter);
			ctx.clearRect(0, 0, canvas.width, canvas.heigth);
			ctx.putImageData(imgData, 0, 0);
		});

		// resetowanie obrazu - wczytanie oryginału
		$('#reset-filter').click(function() {
			ctx.clearRect(0, 0, canvas.width, canvas.heigth);
			ctx.drawImage(img, 0, 0);
			imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			readPixels(imgData);
		});

		/*
		 *  Zastoswoanie własnego filtru w macierzy 3x3 
		 */
		$('#custom-filter').click(function() {
			//przykładowe filtry
			var lowfilter = [1, 1, 1, 1, 1, 1, 1, 1, 1];
			var highpassfilter = [-1, -1, -1, -1, 9, -1, -1, -1, -1];
			var h3filter = [0, -1, 0, -1, 20, -1, 0, -1, 0];
			var oblique = [-1, 0, 0, 0, 1, 0, 0, 0, 0];
			var lapl = [0, -1, 0, -1, 4, -1, 0, -1, 0];
			$('#custom-win').css({
				'display' : 'block'
			});

			//wczytanie filtrów do komórek
			$('#custom-win .low-filter').click(function() {
				$('#custom-filter-values input').each(function(i) {
					$(this).val(lowfilter[i]);
				});
			});
			$('#custom-win .high-pass-filter').click(function() {
				$('#custom-filter-values input').each(function(i) {
					$(this).val(highpassfilter[i]);
				});
			});
			$('#custom-win .high-pass-filter-h3').click(function() {
				$('#custom-filter-values input').each(function(i) {
					$(this).val(h3filter[i]);
				});
			});
			$('#custom-win .oblique-filter').click(function() {
				$('#custom-filter-values input').each(function(i) {
					$(this).val(oblique[i]);
				});
			});
			$('#custom-win .LAPL-filter').click(function() {
				$('#custom-filter-values input').each(function(i) {
					$(this).val(lapl[i]);
				});
			});

			//Zastoswoanie filtru
			$('#custom-win .set').click(function() {
				var customFilter = [];
				$('#custom-win input').each(function(index) {
					customFilter[index] = Number($(this).val()) || 0;
				});
				attachFilter(imgData, customFilter);
				ctx.clearRect(0, 0, canvas.width, canvas.heigth);
				ctx.putImageData(imgData, 0, 0);
			});

			$('#custom-win .close').click(function() {
				$('#custom-win').css({
					"display" : "none"
				});
			});

		});
		/*
		 *  Okno odczytywania kanału RGBA
		 */
		$('#rgba-read').click(function(){
			$('#rgba-win').css({
				'display' : 'block'
			});
			readPixels(imgData);
			$('#rgba-win .close').click(function() {
				$('#rgba-win').css({
					"display" : "none"
				});
			});
		});
	});

	//wczytanie przykładowego zdjęcia Lenna.png
	img.src = "imgs/Lenna.png";
});
