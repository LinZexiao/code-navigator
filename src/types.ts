import { Interface } from 'readline';
import { Message } from 'semantic-ui-react';
import { v4 as uuid } from 'uuid';



var MAC_DEPTH = 10
var MAX_NODE_COUNT = 80

export interface Message {
    id: string
    path: string
    data: any
    callback: (data: any) => void
}

interface MessagePoster {
    postMessage(message: any): void;
}



export class Client {
    onFly: Map<string, Message> = new Map()
    poster: MessagePoster

    constructor() {
        window.addEventListener('message', this.onReceive.bind(this))
        this.poster = acquireVsCodeApi()
    }

    onReceive(event: { data: Message }) {
        const message: Message = event.data
        const callback = this.onFly.get(message.id)?.callback
        if (callback) {
            callback(message.data)
        }
    }

    send(path: string, callback: (data: any) => void, data: any,) {
        const id = uuid()
        this.onFly.set(id, { id, path, data, callback })
        this.poster.postMessage({ id, path, data })
    }
}


export interface Channel {
    onDidReceiveMessage(callback: (e: any) => void): void
    postMessage(message: any): void;
}

export class Server {
    channels: Channel[] = []
    handlers: Map<string, (data: any) => any> = new Map()


    addHandler(path: string, handler: (data: any) => any) {
        this.handlers.set(path, handler)
    }

    addChannel(ch: Channel) {
        this.channels.push(ch)
        ch.onDidReceiveMessage((msg: Message) => {
            msg.callback = (res: any) => {
                ch.postMessage({
                    id: msg.id,
                    data: res,
                })
            }
            this.onReceive(msg)
        })
    }

    onReceive(msg: Message) {
        const handler = this.handlers.get(msg.path)
        if (handler) {
            let res = handler(msg.data)
            msg.callback(res)
        }
    }
}
