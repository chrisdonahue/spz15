(function (spz) {
	spz.helpers = spz.helpers || {};

	/*
		general
	*/

	spz.helpers.range_map_linear = function(w, x, y, z) {
		var m = (z - y) / (x - w);
		var b = (y - (w * m));
		return {
			m: m,
			b: b
		};
	}

	spz.helpers.clip = function(value, min, max) {
		var value_clipped = value;
		if (value < min) {
			value_clipped = min;
		}
		else if (value > max) {
			value_clipped = max;
		}

		return value_clipped;
	}

	/*
		midi
	*/
	
	spz.helpers.midi = spz.helpers.midi || {}

	var _midi_note_names = [
		['C'],
		['C#', 'Db'],
		['D'],
		['D#', 'Eb'],
		['E'],
		['F'],
		['F#', 'Gb'],
		['G'],
		['G#', 'Ab'],
		['A'],
		['A#', 'Bb'],
		['B']];
	spz.helpers.midi.note_number_to_name = function(midi_note_number) {
		while (midi_note_number < 0) {
			midi_note_number += 12;
		}
		dividend = Math.floor(midi_note_number / 12);
		remainder = midi_note_number % 12;
		return _midi_note_names[remainder][0] + String(dividend);
	};
	
	spz.helpers.midi.note_number_key_white_is = (function() {
		var midi_note_number_key_white_is_cache = {};
		return function(midi_note_number) {
			// return memoized
			if (midi_note_number in midi_note_number_key_white_is_cache) {
				return midi_note_number_key_white_is_cache[midi_note_number];
			}

			// otherwise calculate
			while (midi_note_number < 0) {
				midi_note_number += 12;
			}
			remainder = midi_note_number % 12;
			var midi_note_number_key_white_is =  	remainder === 0 ||
													remainder === 2 ||
													remainder === 4 ||
													remainder === 5 ||
													remainder === 7 ||
													remainder === 9 ||
													remainder === 11;

			// memoize
			midi_note_number_key_white_is_cache[midi_note_number] = midi_note_number_key_white_is;

			// return result
			return midi_note_number_key_white_is;
		};
	})();
	
	spz.helpers.midi.note_number_key_black_is = function(midi_note_number) {
		return !(spz.helpers.midi.note_number_key_white_is(midi_note_number));
	};

	spz.helpers.midi.note_number_valid = function (midi_note_number) {
		var range = spz.defines.midi_note_number_range;
		return midi_note_number >= range.lower && midi_note_number <= range.upper;
	};

	/*
		ui
	*/

	spz.helpers.ui = spz.helpers.ui || {}

	spz.helpers.ui.orientation_get = function (width, height) {
		return width > height ? spz.defines.orientation.landscape : spz.defines.orientation.portrait;
	};

	spz.helpers.ui.color_random = function () {
		var r = 255*Math.random()|0,
			g = 255*Math.random()|0,
			b = 255*Math.random()|0;
		return 'rgb(' + r + ',' + g + ',' + b + ')';
	};

})(window.spz);
