import { Server, Channel } from './types'

const server = new Server

export function addHandler(path: string, handler: (data: any) => any) {
    server.addHandler(path, handler)
}

export function addChannel(ch: Channel) {
    server.addChannel(ch)
}
