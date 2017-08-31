/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import 'vs/css!./lightBulbWidget';
import { CancellationTokenSource } from 'vs/base/common/cancellation';
import { dispose, IDisposable } from 'vs/base/common/lifecycle';
import Event, { Emitter } from 'vs/base/common/event';
import * as dom from 'vs/base/browser/dom';
import { ICodeEditor, IContentWidget, IContentWidgetPosition, ContentWidgetPositionPreference } from 'vs/editor/browser/editorBrowser';
import { QuickFixComputeEvent } from './quickFixModel';

export class LightBulbWidget implements IDisposable, IContentWidget {

	private static _prefOnLine = [ContentWidgetPositionPreference.EXACT];
	private static _prefAroundLine = [ContentWidgetPositionPreference.ABOVE, ContentWidgetPositionPreference.BELOW];

	private readonly _domNode: HTMLDivElement;
	private readonly _editor: ICodeEditor;
	private readonly _disposables: IDisposable[] = [];
	private readonly _onClick = new Emitter<{ x: number, y: number }>();

	readonly onClick: Event<{ x: number, y: number }> = this._onClick.event;

	private _position: IContentWidgetPosition;
	private _model: QuickFixComputeEvent;
	private _futureFixes = new CancellationTokenSource();

	constructor(editor: ICodeEditor) {
		this._editor = editor;
		this._editor.addContentWidget(this);

		this._domNode = document.createElement('div');
		dom.addClass(this._domNode, 'lightbulb-glyph');

		this._disposables.push(dom.addStandardDisposableListener(this._domNode, 'click', e => {
			// a bit of extra work to make sure the menu
			// doesn't cover the line-text
			const { top, height } = dom.getDomNodePagePosition(<HTMLDivElement>e.target);
			const { lineHeight } = this._editor.getConfiguration();
			this._onClick.fire({
				x: e.posx,
				y: top + height + Math.floor(lineHeight / 3)
			});
		}));

		this._disposables.push(this._editor.onDidChangeCursorSelection(e => {
			// hide lightbulb when selection starts to
			// enclose it
			if (this._position && e.selection.containsPosition(this._position.position)) {
				this.hide();
			}
		}));
	}

	dispose(): void {
		dispose(this._disposables);
		this._editor.removeContentWidget(this);
	}

	getId(): string {
		return 'LightBulbWidget';
	}

	getDomNode(): HTMLElement {
		return this._domNode;
	}

	getPosition(): IContentWidgetPosition {
		return this._position;
	}

	set model(value: QuickFixComputeEvent) {
		this.hide();
		this._model = value;
		this._futureFixes = new CancellationTokenSource();
		const { token } = this._futureFixes;

		this._model.fixes.done(fixes => {
			if (!token.isCancellationRequested && fixes && fixes.length > 0) {
				this.show(this._model);
			} else {
				this.hide();
			}
		}, err => {
			this.hide();
		});
	}

	get model(): QuickFixComputeEvent {
		return this._model;
	}

	set title(value: string) {
		this._domNode.title = value;
	}

	get title(): string {
		return this._domNode.title;
	}

	show(e: QuickFixComputeEvent): void {
		const { fontInfo } = this._editor.getConfiguration();
		const { lineNumber } = e.position;
		const model = this._editor.getModel();
		const indent = model.getIndentLevel(lineNumber);
		const lineHasSpace = fontInfo.spaceWidth * indent > 28;

		this._position = {
			position: { lineNumber, column: 1 },
			preference: lineHasSpace ? LightBulbWidget._prefOnLine : LightBulbWidget._prefAroundLine
		};

		this._editor.layoutContentWidget(this);
		this._model = e;
	}

	hide(): void {
		this._position = null;
		this._model = null;
		this._futureFixes.cancel();
		this._editor.layoutContentWidget(this);
	}
}
