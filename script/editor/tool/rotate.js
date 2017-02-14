var Vec2 = require('../../util/vec2');

var Action = require('../action');
var LassoHelper = require('./helper/lasso');
var EditorTool = require('./base');
var utils = require('./utils');

var ui = global.ui;

function RotateTool(editor, dir) {
	if (!(this instanceof RotateTool)) {
		if (!dir)
			return new RotateTool(editor);

		var selection = editor.selection();
		var singleBond = selection && selection.bonds &&
		    Object.keys(selection).length == 1 &&
		    selection.bonds.length == 1;

		var action = !singleBond ? Action.fromFlip(selection, dir) :
		    Action.fromBondAlign(selection.bonds[0], dir);
		editor.event.change.dispatch(action);
		return null;
	}

	this.editor = editor;
	this.lassoHelper = new LassoHelper(1, editor);

	if (!editor.selection() || !editor.selection().atoms)
		// otherwise, clear selection
		this.editor.selection(null);
}

RotateTool.prototype = new EditorTool();

RotateTool.prototype.OnMouseDown = function (event) {
	var selection = this.editor.selection();
	if (selection && selection.atoms) {
		console.assert(selection.atoms.length > 0);
		var rnd = this.editor.render;
		var molecule = rnd.ctab.molecule;
		var xy0 = new Vec2();

		if (!selection.atoms || !selection.atoms.length)
			return true;

		var rotId = null;
		var rotAll = false;

		selection.atoms.each(function (aid) {
			var atom = molecule.atoms.get(aid);

			xy0.add_(atom.pp); // eslint-disable-line no-underscore-dangle

			if (rotAll)
				return;

			atom.neighbors.find(function (nei) {
				var hb = molecule.halfBonds.get(nei);

				if (selection.atoms.indexOf(hb.end) == -1) {
					if (hb.loop >= 0) {
						var neiAtom = molecule.atoms.get(aid);
						if (!Object.isUndefined(neiAtom.neighbors.find(function (neiNei) {
							var neiHb = molecule.halfBonds.get(neiNei);
							return neiHb.loop >= 0 && selection.atoms.indexOf(neiHb.end) != -1;
						}))) {
							rotAll = true;
							return true;
						}
					}
					if (rotId == null) {
						rotId = aid;
					} else if (rotId != aid) {
						rotAll = true;
						return true;
					}
				}
				return false;
			});
		});

		if (!rotId && rotId != null)
			xy0 = molecule.atoms.get(rotId).pp;
		else
			xy0 = xy0.scaled(1 / selection.atoms.length);

		this.dragCtx = {
			xy0: xy0,
			angle1: utils.calcAngle(xy0, rnd.page2obj(event)),
			all: rotAll
		};
	} else {
		this.lassoHelper.begin(event);
	}
	return true;
};
RotateTool.prototype.OnMouseMove = function (event) { // eslint-disable-line max-statements
	if (this.lassoHelper.running()) {
		this.editor.selection(this.lassoHelper.addPoint(event));
	} else if ('dragCtx' in this) {
		var editor = this.editor;
		var rnd = editor.render;
		var dragCtx = this.dragCtx;

		var pos = rnd.page2obj(event);
		var angle = utils.calcAngle(dragCtx.xy0, pos) - dragCtx.angle1;
		if (!event.ctrlKey)
			angle = utils.fracAngle(angle);

		var degrees = utils.degrees(angle);

		if ('angle' in dragCtx && dragCtx.angle == degrees) return true;
		if ('action' in dragCtx) dragCtx.action.perform();

		dragCtx.angle = degrees;
		dragCtx.action = Action.fromRotate(
			dragCtx.all ? rnd.ctab.molecule : this.editor.selection() || {},
			dragCtx.xy0, angle);

		if (degrees > 180)
			degrees -= 360;
		else if (degrees <= -180)
			degrees += 360;
		this.editor.event.message.dispatch({ info: degrees + 'º' });

		rnd.update();
	}
	return true;
};

RotateTool.prototype.OnMouseUp = function (event) {
	// atoms to include in a newly created group
	var selection = null; // eslint-disable-line no-unused-vars
	if (this.lassoHelper.running()) { // TODO it catches more events than needed, to be re-factored
		selection = this.lassoHelper.end(event);
	} else if ('dragCtx' in this) {
		if ('action' in this.dragCtx)
			ui.addUndoAction(this.dragCtx.action, true);
		else
			this.editor.selection(null);

		delete this.dragCtx;
	}
	return true;
};

RotateTool.prototype.OnCancel = function () {
	if ('dragCtx' in this) {
		if ('action' in this.dragCtx)
			ui.addUndoAction(this.dragCtx.action, true);
		delete this.dragCtx;
	}
};

module.exports = RotateTool;
