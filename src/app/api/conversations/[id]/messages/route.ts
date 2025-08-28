import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Fetching messages for conversation:', params.id)
    const messages = await db.message.findMany({
      where: { conversationId: params.id },
      orderBy: {
        createdAt: 'asc'
      }
    })

    console.log('Found messages:', messages.length)
    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { content, role } = await request.json()

    console.log('Creating message for conversation:', params.id, 'Role:', role)

    if (!content || !role) {
      return NextResponse.json(
        { error: 'Content and role are required' },
        { status: 400 }
      )
    }

    // Find the conversation to get the userId
    const conversation = await db.conversation.findUnique({
      where: { id: params.id }
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    const message = await db.message.create({
      data: {
        content,
        role,
        conversationId: params.id,
        userId: conversation.userId
      }
    })

    console.log('Created message:', message.id)
    return NextResponse.json(message)
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    )
  }
}