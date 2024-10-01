"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Undo, Redo, Minus, Plus, Bold, Italic, Underline } from "lucide-react"

interface TextObject {
  id: string
  text: string
  x: number
  y: number
  font: string
  size: number
  bold: boolean
  italic: boolean
  underline: boolean
}

export default function Component() {
  const [texts, setTexts] = useState<TextObject[]>([])
  const [history, setHistory] = useState<TextObject[][]>([])
  const [future, setFuture] = useState<TextObject[][]>([])
  const [selectedText, setSelectedText] = useState<string | null>(null)
  const [newText, setNewText] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    drawCanvas()
  }, [texts])

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    texts.forEach((text) => {
      ctx.font = `${text.italic ? "italic " : ""}${text.bold ? "bold " : ""}${text.size}px ${text.font}`
      ctx.fillText(text.text, text.x, text.y)
      if (text.underline) {
        const metrics = ctx.measureText(text.text)
        ctx.beginPath()
        ctx.moveTo(text.x, text.y + 3)
        ctx.lineTo(text.x + metrics.width, text.y + 3)
        ctx.stroke()
      }
    })
  }, [texts])

  const addText = useCallback(() => {
    if (newText) {
      const newTextObject: TextObject = {
        id: Date.now().toString(),
        text: newText,
        x: 50,
        y: 50,
        font: "Arial",
        size: 16,
        bold: false,
        italic: false,
        underline: false,
      }
      setHistory([...history, texts])
      setTexts([...texts, newTextObject])
      setNewText("")
      setFuture([])
    }
  }, [newText, history, texts])

  const updateText = useCallback((id: string, updates: Partial<TextObject>) => {
    setHistory([...history, texts])
    setTexts(texts.map((text) => (text.id === id ? { ...text, ...updates } : text)))
    setFuture([])
  }, [history, texts])

  const deleteText = useCallback((id: string) => {
    setHistory([...history, texts])
    setTexts(texts.filter((text) => text.id !== id))
    setSelectedText(null)
    setFuture([])
  }, [history, texts])

  const undo = useCallback(() => {
    if (history.length > 0) {
      const prevState = history[history.length - 1]
      setFuture([texts, ...future])
      setTexts(prevState)
      setHistory(history.slice(0, -1))
    }
  }, [history, texts, future])

  const redo = useCallback(() => {
    if (future.length > 0) {
      const nextState = future[0]
      setHistory([...history, texts])
      setTexts(nextState)
      setFuture(future.slice(1))
    }
  }, [history, texts, future])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const clickedText = texts.find((text) => x >= text.x && x <= text.x + 100 && y >= text.y - 20 && y <= text.y)

    if (clickedText) {
      setSelectedText(clickedText.id)
      setIsDragging(true)
      setDragStart({ x: x - clickedText.x, y: y - clickedText.y })
    } else {
      setSelectedText(null)
    }
  }, [texts])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDragging || !selectedText) return
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      updateText(selectedText, {
        x: x - dragStart.x,
        y: y - dragStart.y,
      })
    },
    [isDragging, selectedText, dragStart, updateText]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        addText()
      }
    },
    [addText]
  )

  return (
    <div className="flex flex-col min-h-screen">
      <nav className="bg-white shadow-md p-4">
        <img src="https://celebrare.in/assets/img/celebrare-logo.webp" alt="Celebrare Logo" className="h-8" />
      </nav>
      <div className="flex-grow p-4 max-w-4xl mx-auto">
        <div className="flex justify-between mb-4">
          <Button onClick={undo} disabled={history.length === 0}>
            <Undo className="h-4 w-4" />
          </Button>
          <Button onClick={redo} disabled={future.length === 0}>
            <Redo className="h-4 w-4" />
          </Button>
        </div>
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className="border-2 border-green-500 mb-4 bg-gray-200"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        <div className="flex mb-4 space-x-2">
          <Input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type text and press Enter to add"
            className="w-full"
          />
          <Button variant="outline" onClick={addText}>
            Add Text
          </Button>
        </div>
        <div className="flex items-center space-x-2 mb-4">
          <Select onValueChange={(value) => selectedText && updateText(selectedText, { font: value })}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Font" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Arial">Arial</SelectItem>
              <SelectItem value="Verdana">Verdana</SelectItem>
              <SelectItem value="Times New Roman">Times New Roman</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              selectedText && updateText(selectedText, { size: Math.max(8, (texts.find((t) => t.id === selectedText)?.size || 16) - 2) })
            }
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              selectedText && updateText(selectedText, { size: Math.min(72, (texts.find((t) => t.id === selectedText)?.size || 16) + 2) })
            }
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => selectedText && updateText(selectedText, { bold: !texts.find((t) => t.id === selectedText)?.bold })}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => selectedText && updateText(selectedText, { italic: !texts.find((t) => t.id === selectedText)?.italic })}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => selectedText && updateText(selectedText, { underline: !texts.find((t) => t.id === selectedText)?.underline })}
          >
            <Underline className="h-4 w-4" />
          </Button>
          <Button variant="destructive" onClick={() => selectedText && deleteText(selectedText)}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}
