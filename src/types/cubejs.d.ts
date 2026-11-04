declare module 'cubejs' {
  class Cube {
    center: number[]
    cp: number[]
    co: number[]
    ep: number[]
    eo: number[]
    static fromString(state: string): Cube
    static initSolver(): void
    solve(maxDepth?: number): string
  }
  export default Cube
}

declare module 'cubejs/lib/solve' {}
