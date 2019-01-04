$(function(){
	
	var receivedDistributions = null;
	var distributions = null;
	var dataVersion = 0;

	var dataDisplays = [];
	
	function DataDisplay(id, updateFunction){
		this.display = $('#' + id);
		this.dataVersion = 0;
		this.hide = function(){
			this.display.toggleClass('hidden', true);
		}
		this.show = function(){
			if(distributions == null){
				return this;
			}
			this.display.toggleClass('hidden', false);
			if(this.dataVersion < dataVersion){
				this.dataVersion = dataVersion;
				this.update();
			}
			return this;
		}
		this.update = updateFunction;

		var index = this.index = dataDisplays.push(this) - 1;
		
		this.selector = $('#' + id + '-selector').click(function(){
			if(currentDataDisplay.index == index){
				return;
			}
			currentDataDisplay.selector.toggleClass('selected', false);
			currentDataDisplay.hide();
			currentDataDisplay = dataDisplays[index].show();
			currentDataDisplay.selector.toggleClass('selected', true);
		});
	}
	
	var currentDataDisplay = new DataDisplay('tableDisplay', function(){
		var buffer = [];
		for(var i = 0, l = distributions.data.length; i < l; i++){
			WriteTable(i, buffer);
		}
		this.display.empty().append(buffer.join(''));
	});

	function WriteTable(index, buffer){
		buffer.push('<table><caption>', distributions.labels[index]);
		if(distributions.averages[index] !== null){
			buffer.push(' <i>(<span title="average">', distributions.averages[index].toFixed(2), '</span> / <span title="standard deviation">', distributions.standardDeviations[index].toFixed(2), '</span>)');
		}
		buffer.push('</i>');
		var data = distributions.data[index];
		if('xLabels' in distributions){
			buffer.push('</caption><colgroup><col><col><col class="tableBarCell"></colgroup><thead><tr><th>output</th><th>');
			
			if('noPercentage' in distributions){
				buffer.push('#</th><th style="display: none;"></th></thead><tbody>');
				var factor = 100 / (distributions.maxY - distributions.minY);
				var offset = -distributions.minY;
				for(var i = 0, l = data.length; i < l; i++){
					var e = data[i];
					if(e[1] != null){
						var value = e[1];
						buffer.push('<tr><td>', distributions.xLabels[e[0]][1], '</td><td>', value.toFixed(2), '</td><td><div style="width:', ((value + offset) * factor).toFixed(2), '%;">&nbsp;</div></td></tr>'
						);
					}
				}
			}
			else{
				buffer.push('%</th><th style="display: none;"></th></thead><tbody>');
				for(var i = 0, l = data.length; i < l; i++){
					var e = data[i];
					if(e[1] != null){
						var odds = e[1].toFixed(2);
						buffer.push('<tr><td>', distributions.xLabels[e[0]][1], '</td><td>', odds, '</td><td><div style="width:', odds, '%;">&nbsp;</div></td></tr>'
						);
					}
				}
			}
		}
		else{
			buffer.push('</caption><colgroup><col><col><col class="tableBarCell"></colgroup><thead><tr><th>#</th><th>%</th><th style="display: none;"></th></thead><tbody>');
			for(var i = 0, l = data.length; i < l; i++){
				var e = data[i];
				if(e[1] != null){
					var odds = e[1].toFixed(2);
					buffer.push('<tr><td>', e[0], '</td><td>', odds, '</td><td><div style="width:', odds, '%;">&nbsp;</div></td></tr>'
					);
				}
			}
		}
		buffer.push('</tbody></table>');
	}

	new DataDisplay('exportDisplay', function(){
		var buffer = [];
		buffer.push('<textarea readonly>');
		for(var i = 0, l = distributions.data.length; i < l; i++){
			var data = distributions.data[i];
			buffer.push('"', distributions.labels[i], '"');
			if(distributions.averages[i] !== null){
				buffer.push(',', distributions.averages[i], ',' , distributions.standardDeviations[i]);
				buffer.push(',', data[0][0], ',', data[data.length - 1][0]);
			}
			if('xLabels' in distributions){
				buffer.push('\n"output",', 'noPercentage' in distributions ? '#' : '%', '\n');
				for(var iE = 0, lE = data.length; iE < lE; iE++){
					var e = data[iE];
					
					if(e[1] != null){
						buffer.push('"', distributions.xLabels[e[0]][1], '",', e[1], '\n');
					}
				}
			}
			else{
				buffer.push('\n#,%\n');
				for(var iE = 0, lE = data.length; iE < lE; iE++){
					var e = data[iE];
					
					if(e[1] != null){
						buffer.push(e[0], ',', e[1], '\n');
					}
				}
			}
			buffer.push('\n');
		}
		buffer.push('</textarea>');
		this.display.empty().append(buffer.join(''));
	});

	var graphColors = ['#000000', '#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7'];
	var graphMarkers = ['filledCircle', 'filledSquare', 'filledDiamond'];

	new DataDisplay('graphDisplay', function(){
		var seriesSettings = [];
		for(var i = 0, length = distributions.labels.length; i < length; i++){
			seriesSettings[i] = {
				breakOnNull: true,
				label: 'xLabels' in distributions ? distributions.labels[i] : distributions.labels[i] + ' (' + distributions.averages[i].toFixed(2) + ' / ' + distributions.standardDeviations[i].toFixed(2) + ')',
				markerOptions: {style: graphMarkers[Math.floor(i / 8)]}
			};
		}
		$('#graphCanvas').empty();
		if(distributions.minX == distributions.maxX){
			$('#graphCanvas').append('<i>A single value will not be graphed.</i>');
			return;
		}

		$.jqplot('graphCanvas', distributions.data, {
			axes: {
				xaxis: 'xLabels' in distributions ? {
					ticks: distributions.xLabels
				} : {
					min: distributions.minX,
					max: distributions.maxX,
					tickInterval: Math.max(Math.ceil((distributions.maxX - distributions.minX) / 10), 1),
					tickOptions: {formatString: '%d'}
				},
				yaxis: {
					min: distributions.minY,
					max: Math.ceil(distributions.maxY),
					numberTicks: 5,
					tickOptions: {formatString: 'noPercentage' in distributions ? '%.2f' : '%.2f%'}
				}
			},
			legend: {
				show: true,
				xoffset: 10,
				yoffset: 10
			},
			seriesColors: graphColors,
			series: seriesSettings,
			grid: {
				background: '#eee',
				borderColor: '#999',
				borderWidth: 0,
				gridLineColor: '#999',
				shadow: false
			}
		});
	});
	

	var roller = function Roll(){
		var buffer = [];
		var data = receivedDistributions.data[rollerSelect.val()];
		var l = data.length;
		for(var r = 0, a = rollerAmount.val(); r < a; r++){
			var roll = Math.random() * 100;
			var odds = 0;
			for(var i = 0; i < l; i++){
				odds += data[i][1];
				if(odds >= roll){
					buffer.push(data[i][0]);
					break;
				}
			}
		}
		rollerOutput.html(receivedDistributions.labels[rollerSelect.val()] + ': ' + buffer.join(', '));
	}
	
	$('#rollerButton').click(roller);
	var rollerSelect = $('#rollerSelect').change(function(){
		rollerOutput.val('');
	});
	var rollerAmount = $('#rollerAmount');
	var rollerOutput = $('#rollerOutput');
	
	new DataDisplay('rollerDisplay', function(){
		var buffer = [];
		for(var i = 0, length = receivedDistributions.labels.length; i < length; i++){
			buffer.push('<option value="', i, '">', receivedDistributions.labels[i], '</option>');
		}
		rollerSelect.html(buffer.join(''));
		rollerOutput.val('');
		
	});
	

	function DisplayWarnings(warnings){
		var buffer = [];
		for(var i = 0, l = warnings.length; i < l; i++){
			buffer.push(warnings[i], '<br>');
		}
		$('#warningDisplay').empty().append(buffer.join('')).toggleClass('hidden', false);
	}
	
	function DisplayError(error){
		var buffer = [];
		buffer.push('<h3>', error.type, '</h3>', error.message);
		if('index' in error){
			var input = $('#codeInput').val();
			buffer.push('<code>', input.slice(0, error.index - error.token.length));
			buffer.push('<b>', input.slice(error.index - error.token.length, error.index) ,'</b>');
			buffer.push('<i>', input.slice(error.index), '</i></code>');
		}
		$('#errorDisplay').empty().append(buffer.join('')).toggleClass('hidden', false);
	}
	
	$.ajaxSetup({
		error: function () {
			DisplayError({
				type: "server error",
				message: 'The server failed to compute your program. Due to server limitations, programs that take more than five seconds will fail.'
			});
		}
	});

	$('#calculateButton').click(function(){
		distributions = null;
		dataVersion += 1;
		currentDataDisplay.hide();
		$('#warningDisplay').toggleClass('hidden', true);
		$('#errorDisplay').toggleClass('hidden', true);
		$('#calculatingDisplay').toggleClass('hidden', false);
		ResetLink();

		$.post('calculator_limited.php', {program: $('#codeInput').val()}, function(responseData){
			$('#calculatingDisplay').toggleClass('hidden', true);
			if('error' in responseData){
				DisplayError(responseData.error);
			}
			else{
				if('warnings' in responseData){
					DisplayWarnings(responseData.warnings);
				}
				distributions = receivedDistributions = responseData.distributions;
				CalculateAverages();
				CalculateStandardDeviations();
				currentDataMode.apply();
				currentDataDisplay.show();
				CheckDonation();
			}
		}, 'json');

		localStorage.setItem('program', $('#codeInput').val());
	});

	function CheckDonation(){
		var calculationCount = localStorage.getItem('calculationCount');
		if(calculationCount){
			calculationCount = parseInt(calculationCount) + 1;
		}
		else{
			calculationCount = 1;
		}
		localStorage.setItem('calculationCount', calculationCount);
		var donationReply = localStorage.getItem('donationReply');

		if(calculationCount % 50 || donationReply == 'yes' || donationReply == 'no'){
			return;
		}
		
		$('#donationPopup button').click(function(){
			var reply = this.getAttribute('data-reply');
			if(reply == 'show'){
				$('#donationPage-selector').click();
			}
			$('#donationPopup').toggleClass('hidden', true);
			localStorage.setItem('donationReply', reply);
		});
		
		$('#donationPopup').toggleClass('hidden', false);
	}

	function CalculateAverages(){
		distributions.averages = [];
		for(var iD = 0; iD < distributions.data.length; iD++){
			var data = distributions.data[iD];
			var average = 0;
			for(var i = data.length - 1; i >= 0; i--){
				var e = data[i];
				if(e[1] != null){
					average += e[0] * e[1];
				}
			}
			distributions.averages[iD] = average / 100;
		}
	}

	function CalculateStandardDeviations(){
		distributions.standardDeviations = [];
		for(var iD = 0; iD < distributions.data.length; iD++){
			var data = distributions.data[iD];
			var mean = distributions.averages[iD];
			var sd = 0;
			for(var i = data.length - 1; i >= 0; i--){
				var e = data[i];
				if(e[1] != null){
					sd += (e[0] - mean) * (e[0] - mean) * e[1];
				}
			}
			distributions.standardDeviations[iD] = Math.sqrt(sd / 100);
		}
	}

	var dataModes = [];

	function DataMode(id, applyFunction){
		this.dataVersion = 0;
		this.apply = applyFunction;

		var index = this.index = dataModes.push(this) - 1;

		this.selector = $('#' + id + '-selector').click(function(){
			if(currentDataMode.index == index){
				return;
			}
			currentDataMode.selector.toggleClass('selected', false);
			currentDataMode = dataModes[index];
			currentDataMode.selector.toggleClass('selected', true);
			if(distributions == null){
				return;
			}
			currentDataMode.apply();
			dataVersion += 1;
			currentDataDisplay.show();
		});
	}

	var currentDataMode = new DataMode('normalMode', function(){
		distributions = receivedDistributions;
	});

	new DataMode('atLeastMode', function(){
		distributions = {
			labels: receivedDistributions.labels,
			averages: receivedDistributions.averages,
			standardDeviations: receivedDistributions.standardDeviations,
			data: [],
			minX: receivedDistributions.minX,
			maxX: receivedDistributions.maxX,
			minY: 0,
			maxY: 100
		};
		for(var i = 0, l = receivedDistributions.data.length; i < l; i++){
			var sourceData = receivedDistributions.data[i];
			var data = [];
			var cumulative = 100;
			for(var iE = 0, lE = sourceData.length; iE < lE; iE++){
				var e = sourceData[iE];
				if(e[1] != null){
					data.push([e[0], cumulative]);
					cumulative -= e[1];
				}
				else{
					data.push([null, null]);
				}
			}
			distributions.data[i] = data;
		}
	});

	new DataMode('atMostMode', function(){
		distributions = {
			labels: receivedDistributions.labels,
			averages: receivedDistributions.averages,
			standardDeviations: receivedDistributions.standardDeviations,
			data: [],
			minX: receivedDistributions.minX,
			maxX: receivedDistributions.maxX,
			minY: 0,
			maxY: 100
		};
		for(var i = 0, l = receivedDistributions.data.length; i < l; i++){
			var sourceData = receivedDistributions.data[i];
			var data = [];
			var cumulative = 0;
			for(var iE = 0, lE = sourceData.length; iE < lE; iE++){
				var e = sourceData[iE];
				if(e[1] != null){
					cumulative += e[1];
					data.push([e[0], cumulative]);
				}
				else{
					data.push([null, null]);
				}
			}
			distributions.data[i] = data;
		}
	});

	new DataMode('transposedMode', function(){
		distributions = {
			labels: [],
			averages: [],
			standardDeviations: [],
			data: [],
			minX: 0,
			maxX: receivedDistributions.labels.length - 1,
			minY: 0,
			maxY: 0,
			xLabels: []
		};

		for(var i = receivedDistributions.minX; i <= receivedDistributions.maxX; i++){
			distributions.labels.push(i.toString());
			distributions.averages.push(null);
			distributions.standardDeviations.push(null);
			var data = [];
			for(var j = 0, l = receivedDistributions.data.length; j < l; j++){
				var sourceData = receivedDistributions.data[j]
				for(var iE = 0, lE = sourceData.length; iE < lE; iE++){
					var e = sourceData[iE];
					if(e[0] >= i && e[1] != 0){
						if(e[0] == i){
							data.push([j, e[1]]);
							if(e[1] > distributions.maxY){
								distributions.maxY = e[1];
							}
						}
						break;
					}
				}
			}
			distributions.data.push(data);
		}

		for(i = 0, l = receivedDistributions.labels.length; i < l; i++){
			distributions.xLabels[i] = [i, receivedDistributions.labels[i]];
		}
	});
	
	new DataMode('summaryMode', function(){
		distributions = {
			labels: ['mean', 'deviation', 'maximum', 'minimum'],
			averages: [null, null, null, null],
			standardDeviations: [null, null, null, null],
			minX: 0,
			maxX: receivedDistributions.labels.length - 1,
			minY: 0,
			maxY: 0,
			xLabels: [],
			noPercentage: true
		};
		var tmp;
		var means = [];
		var standardDeviations = [];
		var maxima = [];
		var minima = [];
		for(var i = 0; i <= distributions.maxX; i++){
			tmp = receivedDistributions.averages[i];
			means.push([i, tmp]);
			if(tmp > distributions.maxY){
				distributions.maxY = tmp;
			}
			tmp = receivedDistributions.standardDeviations[i];
			standardDeviations.push([i, tmp]);
			if(tmp > distributions.maxY){
				distributions.maxY = tmp;
			}
			var sourceData = receivedDistributions.data[i];
			if(sourceData.length > 0){
				var max = sourceData[0][0];
				var min = max;
				for(var j = 1, l = sourceData.length; j < l; j++){
					var e = sourceData[j][0];
					if(e !== null){
						if(e > max){
							max = e;
						}
						else if(e < min){
							min = e;
						}
					}
				}
				maxima[i] = [i, max];
				minima[i] = [i, min];
				if( max > distributions.maxY){
					distributions.maxY = max;
				}
				if(min < distributions.minY){
					distributions.minY = min;
				}
			}
		}
		
		distributions.data = [means, standardDeviations, maxima, minima];
		
		for(i = 0, l = receivedDistributions.labels.length; i < l; i++){
			distributions.xLabels[i] = [i, receivedDistributions.labels[i]];
		}
		
		debug = distributions;
	});

	/* menu */

	var pages = [];

	function Page(id, showFunction){
		this.container = $('#' + id);

		this.show = showFunction;

		var index = this.index = pages.push(this) - 1;

		this.selector = $('#' + id + '-selector').click(function(){
			if(currentPage.index == index){
				return;
			}
			currentPage.selector.toggleClass('selected', false);
			currentPage.container.toggleClass('hidden', true);
			currentPage = pages[index];
			currentPage.show();
			currentPage.container.toggleClass('hidden', false);
			currentPage.selector.toggleClass('selected', true);
		});
	}

	var currentPage = new Page('calculatorPage', function(){});

	new Page('donationPage', function(){
		if($('#donationPage').is(':empty')){
			$('#donationPage').html('...loading donation options...');
			$.get('donation.html', function(data){
				$('#donationPage').html(data);
			});
		}
	});

	new Page('functionPage', function(){
		if($('#functionPage').is(':empty')){
			$('#functionPage').html('...loading function library...');
			$.get('function_library/index.html', function(data){
				$('#functionPage').html(data);
				$('#functionPage h2').click(function(){
					var section = $(this).next();
					if(section.is(':empty')){
						section.html('...loading...');
						$.get('function_library/' + section.attr('data-url'), function(data){
							section.html(data);
						});
					}
					section.toggleClass('hidden');
				}).next().toggleClass('hidden', true);
			});
		}
	});

	new Page('documentationPage', function(){
		if($('#documentationPage').is(':empty')){
			$('#documentationPage').html('...loading documentation...');
			$.get('documentation/index.html', function(data){
				$('#documentationPage').html(data);
				$('#documentationPage h2').click(function(){
					var section = $(this).next();
					if(section.is(':empty')){
						section.html('...loading...');
						$.get('documentation/' + section.attr('data-url'), function(data){
							section.html(data);
						});
					}
					section.toggleClass('hidden');
				}).next().toggleClass('hidden', true);
			});
		}
	});

	$('#linkField').click(function(){
		CreateLink();
	});

	function ResetLink(){
		$('#linkField').val('click to create link').toggleClass('hasLink', false);
	}

	function CreateLink(){
		var linkField = $('#linkField');
		if(linkField.val() != 'click to create link'){
			return;
		}
		linkField.val('...creating link...');
		$.post('createLink.php', {program: $('#codeInput').val()}, function(link){
			linkField.val(link);
			linkField.toggleClass('hasLink', true);
		}, 'text');
	}
	
	$('#codeInput').val(loadedProgram);
	$('#calculateButton').click();
});
