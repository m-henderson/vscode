/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IJSONSchema } from 'vs/base/common/jsonSchema';
import * as nls from 'vs/nls';
import { CustomEditorDiscretion, CustomEditorSelector } from 'vs/workbench/contrib/customEditor/common/customEditor';
import { ExtensionsRegistry } from 'vs/workbench/services/extensions/common/extensionsRegistry';
import { languagesExtPoint } from 'vs/workbench/services/mode/common/workbenchModeService';

namespace WebviewEditorContribution {
	export const viewType = 'viewType';
	export const displayName = 'displayName';
	export const selector = 'selector';
	export const discretion = 'discretion';
}

interface IWebviewEditorsExtensionPoint {
	readonly [WebviewEditorContribution.viewType]: string;
	readonly [WebviewEditorContribution.displayName]: string;
	readonly [WebviewEditorContribution.selector]?: readonly CustomEditorSelector[];
	readonly [WebviewEditorContribution.discretion]?: CustomEditorDiscretion;
}

const webviewEditorsContribution: IJSONSchema = {
	description: nls.localize('contributes.webviewEditors', 'Contributes webview editors.'),
	type: 'array',
	defaultSnippets: [{ body: [{ viewType: '', displayName: '' }] }],
	items: {
		type: 'object',
		required: [
			WebviewEditorContribution.viewType,
			WebviewEditorContribution.displayName,
			WebviewEditorContribution.selector,
		],
		properties: {
			[WebviewEditorContribution.viewType]: {
				type: 'string',
				description: nls.localize('contributes.viewType', 'Unique identifier of the custom editor.'),
			},
			[WebviewEditorContribution.displayName]: {
				type: 'string',
				description: nls.localize('contributes.displayName', 'Name of the custom editor displayed to users.'),
			},
			[WebviewEditorContribution.selector]: {
				type: 'array',
				description: nls.localize('contributes.selector', 'Set of globs that the custom editor is enabled for.'),
				items: {
					type: 'object',
					properties: {
						filenamePattern: {
							type: 'string',
							description: nls.localize('contributes.selector.filenamePattern', 'Glob that the custom editor is enabled for.'),
						},
						scheme: {
							type: 'string',
							description: nls.localize('contributes.selector.scheme', 'File scheme that the custom editor is enabled for.'),
						}
					}
				}
			},
			[WebviewEditorContribution.discretion]: {
				type: 'string',
				description: nls.localize('contributes.discretion', 'Controls when the custom editor is used. May be overridden by users.'),
				enum: [
					CustomEditorDiscretion.default,
					CustomEditorDiscretion.option
				],
				enumDescriptions: [
					nls.localize('contributes.discretion.default', 'Editor is automatically used for a resource if no other default custom editors are registered for it.'),
					nls.localize('contributes.discretion.option', 'Editor is not automatically used but can be selected by a user.'),
				],
				default: 'default'
			}
		}
	}
};

export const webviewEditorsExtensionPoint = ExtensionsRegistry.registerExtensionPoint<IWebviewEditorsExtensionPoint[]>({
	extensionPoint: 'webviewEditors',
	deps: [languagesExtPoint],
	jsonSchema: webviewEditorsContribution
});
