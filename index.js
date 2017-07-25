const fs = require('fs');
const path = require('path');

function ComlogFileTimeWatcher(options) {
	require('comlog-event-handler')(this);

	var	_self = this;
	this.satus = null; // null = start, true = off, false = on
	this.path = null;
	this.debug = false;
	this.interval = 60000; // 1 Minute
	this.timeout = 30000; // 30 sekunden
	this.debug = false;

	// Private funktionen
	var _running = false, _timer = null;

	function _watch() {
		try {
			if (_running) return;
			_running = true;

			var p = path.normalize((typeof _self.path == 'function') ? _self.path() : _self.path);
			if (_self.debug) console.info('Check '+p+' ...');

			fs.stat(p, function(err, stat) {
				if (err !== null) {
					if (_self.debug) console.error(err.stack || err);
					_self.trigger('error', [new Error("FileTime stat error for "+p+" \n"+err.message)]);
					if (_self.satus === true) _self.trigger('down');
					_self.satus = false;
				} else {
					// Zeit abgelaufen
					if (stat.mtime < (new Date()) - _self.timeout) {
						if (_self.debug) console.info("FileTime file timeout "+p+" "+stat.mtime);
						if (_self.satus === true) _self.trigger('down');
						_self.satus = false;
					}
					// In der Zeit
					else {
						if (_self.debug) console.info("FileTime ok "+p+" "+stat.mtime);
						if (_self.satus === false) _self.trigger('up');
						_self.satus = true;
					}
				}
				_running = false;
				_timer = setTimeout(_watch, _self.interval);
			});
		} catch (e) {
			if (_self.satus === true) _self.trigger('down',[e]);
			_self.trigger('error',[e]);

			_self.satus = false;
			_running = false;
			if (_self.debug) console.error(e.stack || e);
			_timer = setTimeout(_watch, _self.interval);
		}
	}
	
	/**
	 * Überwachung starten
	 */
	this.start = function() {
		_watch();
	};

	/**
	 * Überwachung stoppen
	 */
	this.stop = function() {
		if (_timer !== null) clearInterval(_timer);
	};

	for(var i in options) this[i] = options[i];

	if (typeof this.path == 'string' && this.path.substr(0, 9) == 'function(') {
		this.path = eval('this.path = '+this.path);
	}
}

module.exports = ComlogFileTimeWatcher;