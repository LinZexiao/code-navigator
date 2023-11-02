import { Client } from "./types";


const client = new Client

export function send(path: string, callback: (data: any) => void, data: any,) {
    client.send(path, callback, data)
}
