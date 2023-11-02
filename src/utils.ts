import { log } from 'console';
import { stringify } from 'querystring';
import * as vscode from 'vscode';


export function qurify(obj: vscode.Range): string {
    let query = {
        "start_line": obj.start.line,
        "start_character": obj.start.character,
        "end_line": obj.end.line,
        "end_character": obj.end.character,
    }
    return stringify(query);
}


export function rangeFromQuery(query: string): vscode.Range {
    // let range = new vscode.Range(0, 0, 0, 0);
    let m = {
        "start_line": 0,
        "start_character": 0,
        "end_line": 0,
        "end_character": 0,
    }
    query.split('&').forEach((item) => {
        let [key, value] = item.split('=');
        switch (key) {
            case "start_line":
                m.start_line = Number(value);
                break;
            case "start_character":
                m.start_character = Number(value);
                break;
            case "end_line":
                m.end_line = Number(value);
                break;
            case "end_character":
                m.end_character = Number(value);
                break;
            default:
                break;
        }
    })

    let range = new vscode.Range(m.start_line, m.start_character, m.end_line, m.end_character);
    return range;
}


// parseUri parse a string like file:///path@symbol:line:col:line:col to {uri: vscode.Uri , range : vscode.Range , symbol:string}
export function parseUriWithRange(s: string): { uri: vscode.Uri, range: vscode.Range, symbol: string } {
    let [uriStr, frag] = s.split('@', 2)
    let uri = vscode.Uri.parse(uriStr)
    let [symbol, l0, c0, l1, c1] = frag.split(':', 5)
    let p = parseInt
    let range = new vscode.Range(p(l0), p(c0), p(l1), p(c1))

    return {
        uri: uri,
        range: range,
        symbol: symbol
    }
}

export async function openFileWithRange(uri: vscode.Uri, range: vscode.Range) {
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document, { selection: range });
}
