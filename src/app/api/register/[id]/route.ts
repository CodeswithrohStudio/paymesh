import { NextRequest, NextResponse } from 'next/server'
import { deleteApi, getApiById } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check if API exists
    const api = await getApiById(id)
    if (!api) {
      return NextResponse.json({ error: 'API not found' }, { status: 404 })
    }

    // In a production app, we would also verify if the requester owns this API
    // by checking their session/wallet. For this demo, we'll proceed.
    
    await deleteApi(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
