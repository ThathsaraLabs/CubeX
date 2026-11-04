import * as d3 from 'd3'
import { useEffect, useMemo, useRef } from 'react'
import { type ColorId, type CubeState, type Move } from '../../cube/engine'
import { formatCycles, permutationCyclesForMove, permutationForMove, stickerLabel } from '../engine'

const COLORS: Record<ColorId, string> = {
  U: '#eef4ed', R: '#e4524d', F: '#58d488', D: '#efd34d', L: '#f08a3d', B: '#527ce5',
}

interface Point { x: number; y: number }
interface NodeDatum { index: number; source: Point; destination: Point; color: ColorId; label: string; cycle: number }

function cycleLayout(cycles: readonly (readonly number[])[]): Map<number, Point> {
  const positions = new Map<number, Point>()
  const columns = cycles.length > 3 ? 3 : Math.max(1, cycles.length)
  const rows = Math.ceil(cycles.length / columns)
  cycles.forEach((cycle, cycleIndex) => {
    const column = cycleIndex % columns
    const row = Math.floor(cycleIndex / columns)
    const centerX = (column + .5) * (420 / columns)
    const centerY = (row + .5) * (210 / rows)
    const radius = Math.min(47, 420 / columns * .28, 210 / rows * .32)
    cycle.forEach((index, order) => {
      const angle = -Math.PI / 2 + order / cycle.length * Math.PI * 2
      positions.set(index, { x: centerX + Math.cos(angle) * radius, y: centerY + Math.sin(angle) * radius })
    })
  })
  return positions
}

export function PermutationDiagram({ move, state, sourceState, transitionId }: {
  move: Move | null
  state: CubeState
  sourceState?: CubeState
  transitionId?: number
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const cycles = useMemo(() => move ? permutationCyclesForMove(move) : [], [move])
  const cycleNotation = useMemo(() => formatCycles(cycles), [cycles])

  useEffect(() => {
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    if (!move || cycles.length === 0) return

    const permutation = permutationForMove(move)
    const positions = cycleLayout(cycles)
    const before = sourceState ?? state
    const defs = svg.append('defs')
    defs.append('marker').attr('id', 'cycle-arrow').attr('viewBox', '0 0 8 8').attr('refX', 6).attr('refY', 4)
      .attr('markerWidth', 5).attr('markerHeight', 5).attr('orient', 'auto').append('path').attr('d', 'M0,0 L8,4 L0,8 Z').attr('fill', '#6f8a7c')

    const nodes: NodeDatum[] = cycles.flatMap((cycle, cycleIndex) => cycle.map((index) => ({
      index,
      source: positions.get(index)!,
      destination: positions.get(permutation[index])!,
      color: before.stickers[index],
      label: stickerLabel(index),
      cycle: cycleIndex,
    })))

    svg.append('g').attr('class', 'permutation-links').selectAll('path').data(nodes).join('path')
      .attr('d', (datum) => {
        const dx = datum.destination.x - datum.source.x
        const dy = datum.destination.y - datum.source.y
        const bend = Math.sqrt(dx * dx + dy * dy) * .42
        return `M${datum.source.x},${datum.source.y} Q${(datum.source.x + datum.destination.x) / 2 - dy / bend * 5},${(datum.source.y + datum.destination.y) / 2 + dx / bend * 5} ${datum.destination.x},${datum.destination.y}`
      })
      .attr('fill', 'none').attr('stroke', '#52675d').attr('stroke-width', 1.15).attr('stroke-dasharray', '3 3').attr('marker-end', 'url(#cycle-arrow)')

    const node = svg.append('g').attr('class', 'permutation-nodes').selectAll('g').data(nodes).join('g')
      .attr('transform', (datum) => `translate(${datum.source.x},${datum.source.y})`)

    node.append('circle').attr('r', 10).attr('fill', (datum) => COLORS[datum.color]).attr('stroke', '#09100d').attr('stroke-width', 2)
      .style('filter', (datum) => `drop-shadow(0 0 5px ${COLORS[datum.color]}66)`)
    node.append('text').attr('text-anchor', 'middle').attr('dy', '3').attr('fill', '#07100a').attr('font-size', 6.5).attr('font-weight', 700).text((datum) => datum.label)

    if (sourceState && transitionId !== undefined) {
      node.transition().duration(340).ease(d3.easeCubicOut).attr('transform', (datum) => `translate(${datum.destination.x},${datum.destination.y})`)
    } else {
      node.attr('transform', (datum) => `translate(${datum.destination.x},${datum.destination.y})`)
    }
  }, [cycles, move, sourceState, state, transitionId])

  return <div className="permutation-visual">
    {move ? <svg ref={svgRef} role="img" aria-label={`Sticker permutation cycles for ${move}`} viewBox="0 0 420 210" preserveAspectRatio="xMidYMid meet" /> : <div className="identity-state"><span>e</span><p>Identity permutation</p></div>}
    <div className="permutation-meta"><span>{cycles.length} CYCLES</span><span>{cycles.reduce((total, cycle) => total + cycle.length, 0)} MOVED STICKERS</span></div>
    <code className="cycle-notation" title={cycleNotation}>{cycleNotation || '()'}</code>
  </div>
}
