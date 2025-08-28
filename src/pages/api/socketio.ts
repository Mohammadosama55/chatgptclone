import { NextApiRequest, NextApiResponse } from 'next'
import { Server as ServerIO } from 'socket.io'
import { Server as NetServer } from 'http'
import { setupSocket } from '@/lib/socket'

export const config = {
  api: {
    bodyParser: false,
  },
}

type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: ServerIO
    }
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (!res.socket.server.io) {
    console.log('Setting up Socket.IO server...')
    
    const io = new ServerIO(res.socket.server, {
      path: '/api/socketio',
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    })
    
    setupSocket(io)
    res.socket.server.io = io
  }
  
  res.end()
}