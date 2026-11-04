import { describe, expect, it } from 'vitest'
import type { GestureLandmark } from '../store/gestureStore'
import { handContacts, projectHands } from './handProjection'

const hand = (offset: number): GestureLandmark[] => Array.from({ length: 21 }, (_, index) => ({ x: offset + index * .002, y: .45 + index * .002, z: -.02 * (index % 4) }))

describe('3D gesture hands', () => {
  it('projects two hands and creates three contacts per hand', () => {
    const projected = projectHands([hand(.25), hand(.65)])
    const contacts = handContacts(projected)
    expect(projected).toHaveLength(2)
    expect(contacts).toHaveLength(6)
    expect(new Set(contacts.map(({ handIndex }) => handIndex))).toEqual(new Set([0, 1]))
    contacts.forEach(({ surface }) => expect(surface.some((axis) => Math.abs(axis) === 1.58)).toBe(true))
  })
})
