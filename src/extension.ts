import * as vscode from 'vscode';
import { dotviewCmd } from './dispose/dotview';
import * as server from './server'
import { openFileWithRange, parseUriWithRange } from './utils';



export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "code navigator" is now active!');

	server.addHandler("/open/range", (key: string) => {
		let { uri, range } = parseUriWithRange(key)
		openFileWithRange(uri, range)
	})

	context.subscriptions.push(
		dotviewCmd(context)
	);
}

export function deactivate() { }
