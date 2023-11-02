import * as vscode from 'vscode';
import { log } from 'console';
import { Children } from 'react';
import { stringify } from 'querystring';
import path = require('path');

import * as server from '../server';


export class Node extends vscode.CallHierarchyIncomingCall {
    id: string;

    constructor(obj: vscode.CallHierarchyItem | vscode.CallHierarchyIncomingCall) {
        let hierarchy: vscode.CallHierarchyItem;
        let ranges: vscode.Range[] = []
        if (obj instanceof vscode.CallHierarchyIncomingCall) {
            hierarchy = obj.from;
            ranges = obj.fromRanges
        } else {
            hierarchy = obj;
        }

        super(hierarchy, ranges);

        this.id = `${hierarchy.uri.toString()}@${hierarchy.name}:${hierarchy.range.start.line}:${hierarchy.range.start.character}:${hierarchy.range.end.line}:${hierarchy.range.end.character}`;
    }
}



const info = vscode.window.showInformationMessage;
const warn = vscode.window.showWarningMessage;

var MAC_DEPTH = 10
var MAX_NODE_COUNT = 80

export function dotviewCmd(context: vscode.ExtensionContext) {
    return vscode.commands.registerCommand('codeNavigator.callView', async () => {
        // get call info
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            warn("No active editor");
            return;
        }

        let document = activeEditor.document;

        let callHierarchyItems = await vscode.commands.executeCommand<vscode.CallHierarchyItem[]>('vscode.prepareCallHierarchy', document.uri, activeEditor.selection.active);

        if (callHierarchyItems.length === 0) {
            warn("No call hierarchy");
            return;
        }
        const callHierarchy = callHierarchyItems[0];

        let node = new Node(callHierarchy);

        let { store, edge, group } = await levelOrderTravel(node);

        let dot = genDot(store, edge, group);

        server.addHandler("/dot", () => {
            return dot
        })

        let view = renderView(context, node.from.name);
        server.addChannel(view)
    })
}



export async function levelOrderTravel(root: Node): Promise<{ store: Map<string, Node>, edge: string[][], group: Map<string, string[]> }> {
    let store: Map<string, Node> = new Map();
    let edge: string[][] = [];
    let group: Map<string, string[]> = new Map;

    // init
    store.set(root.id, root);
    group.set(root.from.uri.toString(), [root.id]);

    let guard = ""
    let queue: (string)[] = [root.id];
    queue.push(guard);

    let deepCount = 0
    let nodeCount = 0
    while (queue.length && nodeCount < MAX_NODE_COUNT && deepCount < MAC_DEPTH) {
        let node = queue.shift()!;
        if (node === guard) {
            deepCount++;
            if (queue.length != 0) {
                queue.push(guard);
            }
            continue;
        } else {
            nodeCount++;
        }

        let childs = await getChildren(store.get(node)!);
        for (let child of childs) {
            let childId = child.id;
            edge.push([node, childId]);

            if (!store.has(childId)) {
                store.set(childId, child);
                queue.push(childId);

                let file: string = child.from.uri.toString();
                if (!group.has(file)) {
                    group.set(file, [childId]);
                } else {
                    group.get(file)!.push(childId);
                }
            }
        }
    }

    log("node count:", nodeCount);
    log("deep count:", deepCount);

    return {
        store: store,
        edge: edge,
        group: group
    }
}




async function getChildren(father: Node): Promise<Node[]> {
    let incoming = await vscode.commands.executeCommand<vscode.CallHierarchyIncomingCall[]>('vscode.provideIncomingCalls', father.from);
    let children: Node[] = incoming.map((item) => new Node(item));
    return children;
}

export async function nodeTest(context: vscode.ExtensionContext) {

}


function genDot(store: Map<string, Node>, edge: string[][], group: Map<string, string[]>): string {
    const workspace = vscode.workspace.workspaceFolders?.[0].uri!

    log("workspace", workspace.fsPath, workspace.path)

    let dot = `digraph G {\n rankdir="LR" \n`;

    for (let [file, nodes] of group) {
        dot += `subgraph "cluster_${file}" {\n`;
        dot += `label="${file.replace(workspace.path, "").replace("file:///", "")}";\n`;
        // dot += `color=blue;\n`;
        for (let node of nodes) {
            dot += `"${node}" [label="${store.get(node)!.from.name}"];\n`;
        }
        dot += "}\n";
    }

    for (let [from, to] of edge) {
        dot += `"${from}" -> "${to}";\n`;
    }

    dot += "}";

    return dot;
}



function renderView(context: vscode.ExtensionContext, title: string): vscode.Webview {
    const panel = vscode.window.createWebviewPanel(
        'CallNavigator',
        title,
        vscode.ViewColumn.One,
        {
            retainContextWhenHidden: true,
            enableScripts: true,
        }
    );

    let jsUrl = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'dist', 'webview.js')));

    panel.webview.html = `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<script src="${jsUrl}"></script>
				<title>Document</title>
			</head>
			<body>
				<div id="app"></div>
			</body>
			</html>`;

    return panel.webview;
}
