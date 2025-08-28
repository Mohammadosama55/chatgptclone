'use client'

import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

interface UseSocketProps {
  url?: string
  onMessage?: (message: any) => void
  onConversationCreated?: (conversation: any) => void
  onConversationDeleted?: (conversationId: string) => void
  onUserTyping?: (data: { userId: string; isTyping: boolean; conversationId: string }) => void
  onConnected?: (data: any) => void
}

export const useSocket = ({
  url = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000',
  onMessage,
  onConversationCreated,
  onConversationDeleted,
  onUserTyping,
  onConnected
}: UseSocketProps = {}) => {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(url, {
      transports: ['websocket', 'polling']
    })

    const socket = socketRef.current

    // Connection event
    socket.on('connected', (data) => {
      console.log('Connected to socket server:', data)
      onConnected?.(data)
    })

    // Message event
    socket.on('message', (message) => {
      console.log('Received message:', message)
      onMessage?.(message)
    })

    // Conversation events
    socket.on('conversation-created', (conversation) => {
      console.log('Conversation created:', conversation)
      onConversationCreated?.(conversation)
    })

    socket.on('conversation-deleted', (conversationId) => {
      console.log('Conversation deleted:', conversationId)
      onConversationDeleted?.(conversationId)
    })

    // Typing events
    socket.on('user-typing', (data) => {
      onUserTyping?.(data)
    })

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error)
    })

    // Cleanup on unmount
    return () => {
      socket.disconnect()
    }
  }, [url, onMessage, onConversationCreated, onConversationDeleted, onUserTyping, onConnected])

  // Socket actions
  const joinConversation = (conversationId: string) => {
    socketRef.current?.emit('join-conversation', conversationId)
  }

  const leaveConversation = (conversationId: string) => {
    socketRef.current?.emit('leave-conversation', conversationId)
  }

  const sendMessage = (data: {
    message: string
    conversationId: string
    userId?: string
  }) => {
    socketRef.current?.emit('send-message', data)
  }

  const sendTyping = (data: { conversationId: string; isTyping: boolean }) => {
    socketRef.current?.emit('typing', data)
  }

  const createConversation = (data: { title: string; userId?: string }) => {
    socketRef.current?.emit('create-conversation', data)
  }

  const deleteConversation = (conversationId: string) => {
    socketRef.current?.emit('delete-conversation', conversationId)
  }

  return {
    socket: socketRef.current,
    joinConversation,
    leaveConversation,
    sendMessage,
    sendTyping,
    createConversation,
    deleteConversation
  }
}