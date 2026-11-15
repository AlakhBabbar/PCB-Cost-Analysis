// Shared by the header and every row so the columns line up. The last column holds the switch and row buttons.
// Written out in full because Tailwind only picks up class names it can read as plain text.
const COLS = {
  choice: 'md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_6.5rem_5rem_6.5rem_10.5rem]',
  choiceNote: 'md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_6.5rem_5rem_6.5rem_minmax(0,1fr)_10.5rem]',
  number: 'md:grid-cols-[minmax(4rem,1fr)_minmax(4rem,1fr)_6.5rem_5rem_6.5rem_10.5rem]',
  numberNote: 'md:grid-cols-[minmax(4rem,1fr)_minmax(4rem,1fr)_6.5rem_5rem_6.5rem_minmax(0,1fr)_10.5rem]',
}

export const gridCols = (note, kind = 'choice') => COLS[`${kind}${note ? 'Note' : ''}`]
