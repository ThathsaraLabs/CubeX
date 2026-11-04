interface IconProps { name: 'cube' | 'orbit' | 'scan' | 'edit' | 'book' | 'settings' | 'spark' | 'undo' | 'redo' | 'reset'; size?: number }

const paths: Record<IconProps['name'], React.ReactNode> = {
  cube: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4.3 7.7 7.7 4.4 7.7-4.4M12 21v-8.9"/></>,
  orbit: <><circle cx="12" cy="12" r="2"/><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(35 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(-35 12 12)"/></>,
  scan: <><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><circle cx="12" cy="12" r="3"/></>,
  edit: <><path d="m4 20 4.4-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z"/><path d="m14 7 3 3"/></>,
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16ZM20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19 13.5v-3l-2-.7-.7-1.7.9-1.9-2.1-2.1-1.9.9-1.7-.7L10.5 2h-3l-.7 2-1.7.7-1.9-.9-2.1 2.1.9 1.9-.7 1.7-2 .7v3l2 .7.7 1.7-.9 1.9 2.1 2.1 1.9-.9 1.7.7.7 2h3l.7-2 1.7-.7 1.9.9 2.1-2.1-.9-1.9.7-1.7 2-.4Z" transform="translate(1.5) scale(.88)"/></>,
  spark: <path d="m12 2 1.6 5.1L19 9l-5.4 1.9L12 16l-1.6-5.1L5 9l5.4-1.9L12 2Zm7 13 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z"/>,
  undo: <path d="M9 7 5 11l4 4M5 11h8a6 6 0 0 1 6 6v1"/>,
  redo: <path d="m15 7 4 4-4 4m4-4h-8a6 6 0 0 0-6 6v1"/>,
  reset: <><path d="M20 7v5h-5"/><path d="M19 12a7 7 0 1 0-2 5"/></>,
}

export function Icon({ name, size = 20 }: IconProps) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}
