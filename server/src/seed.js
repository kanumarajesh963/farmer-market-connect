import 'dotenv/config';
import { pool } from './db.js';

// Crop catalog — each crop's image keyword actually matches the crop, unlike
// the old frontend mock which cycled through 6 unrelated stock photos.
const CROPS = [
  { name: 'Alphonso Mangoes', category: 'Fruits', keyword: 'mango' },
  { name: 'Basmati Rice', category: 'Grains', keyword: 'rice-paddy' },
  { name: 'Red Chilli', category: 'Spices', keyword: 'red-chilli' },
  { name: 'Tur Dal', category: 'Pulses', keyword: 'lentils' },
  { name: 'Tomatoes', category: 'Vegetables', keyword: 'tomato' },
  { name: 'Groundnut', category: 'Oilseeds', keyword: 'peanut' },
  { name: 'Onions', category: 'Vegetables', keyword: 'onion' },
  { name: 'Turmeric', category: 'Spices', keyword: 'turmeric' },
  { name: 'Wheat', category: 'Grains', keyword: 'wheat-field' },
  { name: 'Sugarcane', category: 'Grains', keyword: 'sugarcane' },
  { name: 'Green Chilli', category: 'Vegetables', keyword: 'green-chilli' },
  { name: 'Bananas', category: 'Fruits', keyword: 'banana' },
  { name: 'Potatoes', category: 'Vegetables', keyword: 'potato' },
  { name: 'Chickpeas', category: 'Pulses', keyword: 'chickpeas' },
  { name: 'Cotton', category: 'Grains', keyword: 'cotton-field' },
];

// Real, self-contained images (base64-encoded SVG illustrations, one per
// category). Nothing here is fetched from an external/random source, so this
// can never return an unrelated or inappropriate photo, unlike the old
// loremflickr-by-keyword lookup.
const CATEGORY_IMAGE = {
  Vegetables: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MDAgNTAwIj4KICA8cmVjdCB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iI2VhZjNlMSIvPgogIDxjaXJjbGUgY3g9IjQyMCIgY3k9IjkwIiByPSI0NiIgZmlsbD0iI2Y2ZDM2NSIvPgogIDxyZWN0IHg9IjAiIHk9IjMzMCIgd2lkdGg9IjUwMCIgaGVpZ2h0PSIxNzAiIGZpbGw9IiM3YTUyMzAiLz4KICA8cmVjdCB4PSIwIiB5PSIzMTAiIHdpZHRoPSI1MDAiIGhlaWdodD0iMzAiIGZpbGw9IiM4YTYyMzgiLz4KICA8Zz4KICAgIDxwYXRoIGQ9Ik0xMjAgMzMwIEwxMjAgMjQwIFExMjAgMjEwIDE0MCAyMTAgUTE2MCAyMTAgMTYwIDI0MCBMMTYwIDMzMCBaIiBmaWxsPSIjZTg4NTNhIi8+CiAgICA8cGF0aCBkPSJNMTMyIDIxMCBMMTI4IDE3MCBNMTQwIDIxMCBMMTQwIDE2NSBNMTQ4IDIxMCBMMTUyIDE3MCIgc3Ryb2tlPSIjM2Y3ZDMyIiBzdHJva2Utd2lkdGg9IjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgogIDwvZz4KICA8Zz4KICAgIDxwYXRoIGQ9Ik0yMjAgMzMwIEwyMjAgMjUwIFEyMjAgMjIwIDI0MCAyMjAgUTI2MCAyMjAgMjYwIDI1MCBMMjYwIDMzMCBaIiBmaWxsPSIjZTg4NTNhIi8+CiAgICA8cGF0aCBkPSJNMjMyIDIyMCBMMjI4IDE3OCBNMjQwIDIyMCBMMjQwIDE3MiBNMjQ4IDIyMCBMMjUyIDE3OCIgc3Ryb2tlPSIjM2Y3ZDMyIiBzdHJva2Utd2lkdGg9IjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgogIDwvZz4KICA8Zz4KICAgIDxlbGxpcHNlIGN4PSIzNDAiIGN5PSIzMDAiIHJ4PSI0NSIgcnk9IjM0IiBmaWxsPSIjNGY4ZjNiIi8+CiAgICA8ZWxsaXBzZSBjeD0iMzgwIiBjeT0iMzE1IiByeD0iMzgiIHJ5PSIyOCIgZmlsbD0iIzVkYTE0NSIvPgogIDwvZz4KICA8dGV4dCB4PSIyNTAiIHk9IjQ3MCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjYiIGZvbnQtd2VpZ2h0PSI3MDAiIGZpbGw9IiMyZjRhMjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlZlZ2V0YWJsZXM8L3RleHQ+Cjwvc3ZnPgo=',
  Fruits: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MDAgNTAwIj4KICA8cmVjdCB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iI2ZkZjBlNiIvPgogIDxjaXJjbGUgY3g9IjQyMCIgY3k9IjkwIiByPSI0NiIgZmlsbD0iI2Y2ZDM2NSIvPgogIDxyZWN0IHg9IjAiIHk9IjM4MCIgd2lkdGg9IjUwMCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiNjOThhNTIiLz4KICA8cmVjdCB4PSIyMzAiIHk9IjIzMCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzZiNDIyNiIvPgogIDxlbGxpcHNlIGN4PSIyNDAiIGN5PSIxOTAiIHJ4PSIxMzAiIHJ5PSIxMDAiIGZpbGw9IiM0ZjhmM2IiLz4KICA8Y2lyY2xlIGN4PSIxODAiIGN5PSIyMDAiIHI9IjIyIiBmaWxsPSIjZDE0NDJmIi8+CiAgPGNpcmNsZSBjeD0iMjQwIiBjeT0iMTYwIiByPSIyMiIgZmlsbD0iI2QxNDQyZiIvPgogIDxjaXJjbGUgY3g9IjMwMCIgY3k9IjIxMCIgcj0iMjIiIGZpbGw9IiNkMTQ0MmYiLz4KICA8Y2lyY2xlIGN4PSIyMjAiIGN5PSIyNDAiIHI9IjIyIiBmaWxsPSIjZDE0NDJmIi8+CiAgPGNpcmNsZSBjeD0iMjkwIiBjeT0iMTUwIiByPSIyMiIgZmlsbD0iI2QxNDQyZiIvPgogIDxlbGxpcHNlIGN4PSIyNTAiIGN5PSI0MjAiIHJ4PSI5MCIgcnk9IjI2IiBmaWxsPSIjZTBhNDVjIi8+CiAgPGNpcmNsZSBjeD0iMjE1IiBjeT0iNDA1IiByPSIyMCIgZmlsbD0iI2QxNDQyZiIvPgogIDxjaXJjbGUgY3g9IjI1NSIgY3k9IjQwMCIgcj0iMjAiIGZpbGw9IiNmMmIyM2MiLz4KICA8Y2lyY2xlIGN4PSIyOTAiIGN5PSI0MTAiIHI9IjIwIiBmaWxsPSIjZDE0NDJmIi8+CiAgPHRleHQgeD0iMjUwIiB5PSI0NzAiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjI2IiBmb250LXdlaWdodD0iNzAwIiBmaWxsPSIjN2EzNDE4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5GcnVpdHM8L3RleHQ+Cjwvc3ZnPgo=',
  Grains: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MDAgNTAwIj4KICA8cmVjdCB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iI2ZhZjNkOSIvPgogIDxjaXJjbGUgY3g9IjQyMCIgY3k9IjkwIiByPSI0NiIgZmlsbD0iI2Y2ZDM2NSIvPgogIDxyZWN0IHg9IjAiIHk9IjM2MCIgd2lkdGg9IjUwMCIgaGVpZ2h0PSIxNDAiIGZpbGw9IiNkOWI2NWEiLz4KICA8ZyBzdHJva2U9IiNhNjdjMWUiIHN0cm9rZS13aWR0aD0iNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIj4KICAgIDxsaW5lIHgxPSIxNTAiIHkxPSI0MDAiIHgyPSIxNTAiIHkyPSIxOTAiLz4KICAgIDxsaW5lIHgxPSIyMjAiIHkxPSI0MDAiIHgyPSIyMjAiIHkyPSIxNTAiLz4KICAgIDxsaW5lIHgxPSIyOTAiIHkxPSI0MDAiIHgyPSIyOTAiIHkyPSIxNzUiLz4KICAgIDxsaW5lIHgxPSIzNjAiIHkxPSI0MDAiIHgyPSIzNjAiIHkyPSIyMDUiLz4KICA8L2c+CiAgPGcgZmlsbD0iI2U4YzM0YSI+CiAgICA8ZWxsaXBzZSBjeD0iMTQwIiBjeT0iMTgwIiByeD0iMTAiIHJ5PSIxOCIvPgogICAgPGVsbGlwc2UgY3g9IjE2MCIgY3k9IjE5NSIgcng9IjEwIiByeT0iMTgiLz4KICAgIDxlbGxpcHNlIGN4PSIxNDAiIGN5PSIyMTUiIHJ4PSIxMCIgcnk9IjE4Ii8+CiAgICA8ZWxsaXBzZSBjeD0iMTYwIiBjeT0iMjMwIiByeD0iMTAiIHJ5PSIxOCIvPgogICAgPGVsbGlwc2UgY3g9IjIxMCIgY3k9IjE0MCIgcng9IjEwIiByeT0iMTgiLz4KICAgIDxlbGxpcHNlIGN4PSIyMzAiIGN5PSIxNTUiIHJ4PSIxMCIgcnk9IjE4Ii8+CiAgICA8ZWxsaXBzZSBjeD0iMjEwIiBjeT0iMTc1IiByeD0iMTAiIHJ5PSIxOCIvPgogICAgPGVsbGlwc2UgY3g9IjIzMCIgY3k9IjE5MCIgcng9IjEwIiByeT0iMTgiLz4KICAgIDxlbGxpcHNlIGN4PSIyODAiIGN5PSIxNjUiIHJ4PSIxMCIgcnk9IjE4Ii8+CiAgICA8ZWxsaXBzZSBjeD0iMzAwIiBjeT0iMTgwIiByeD0iMTAiIHJ5PSIxOCIvPgogICAgPGVsbGlwc2UgY3g9IjI4MCIgY3k9IjIwMCIgcng9IjEwIiByeT0iMTgiLz4KICAgIDxlbGxpcHNlIGN4PSIzMDAiIGN5PSIyMTUiIHJ4PSIxMCIgcnk9IjE4Ii8+CiAgICA8ZWxsaXBzZSBjeD0iMzUwIiBjeT0iMTk1IiByeD0iMTAiIHJ5PSIxOCIvPgogICAgPGVsbGlwc2UgY3g9IjM3MCIgY3k9IjIxMCIgcng9IjEwIiByeT0iMTgiLz4KICAgIDxlbGxpcHNlIGN4PSIzNTAiIGN5PSIyMzAiIHJ4PSIxMCIgcnk9IjE4Ii8+CiAgICA8ZWxsaXBzZSBjeD0iMzcwIiBjeT0iMjQ1IiByeD0iMTAiIHJ5PSIxOCIvPgogIDwvZz4KICA8dGV4dCB4PSIyNTAiIHk9IjQ3MCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjYiIGZvbnQtd2VpZ2h0PSI3MDAiIGZpbGw9IiM1YzQ0MTMiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkdyYWluczwvdGV4dD4KPC9zdmc+Cg==',
  Pulses: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MDAgNTAwIj4KICA8cmVjdCB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iI2YxZWFmNyIvPgogIDxjaXJjbGUgY3g9IjQyMCIgY3k9IjkwIiByPSI0NiIgZmlsbD0iI2Y2ZDM2NSIvPgogIDxyZWN0IHg9IjAiIHk9IjM4MCIgd2lkdGg9IjUwMCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiM4YTczNTAiLz4KICA8cGF0aCBkPSJNMTUwIDM4MCBRMTQwIDI2MCAxOTAgMjAwIFEyNDAgMTUwIDMwMCAxNDAiIHN0cm9rZT0iIzViOGEzZiIgc3Ryb2tlLXdpZHRoPSI4IiBmaWxsPSJub25lIi8+CiAgPGcgZmlsbD0iIzdhNWFhOCI+CiAgICA8cGF0aCBkPSJNMTgwIDI2MCBRMjAwIDI1MCAyMjAgMjYwIFEyMjAgMjg1IDIwMCAyOTAgUTE4MCAyODUgMTgwIDI2MCBaIi8+CiAgICA8Y2lyY2xlIGN4PSIxOTIiIGN5PSIyNjYiIHI9IjgiIGZpbGw9IiM5NTc4YzQiLz4KICAgIDxjaXJjbGUgY3g9IjIwNiIgY3k9IjI3MiIgcj0iOCIgZmlsbD0iIzk1NzhjNCIvPgogIDwvZz4KICA8ZyBmaWxsPSIjN2E1YWE4Ij4KICAgIDxwYXRoIGQ9Ik0yMzAgMjEwIFEyNTAgMjAwIDI3MCAyMTAgUTI3MCAyMzUgMjUwIDI0MCBRMjMwIDIzNSAyMzAgMjEwIFoiLz4KICAgIDxjaXJjbGUgY3g9IjI0MiIgY3k9IjIxNiIgcj0iOCIgZmlsbD0iIzk1NzhjNCIvPgogICAgPGNpcmNsZSBjeD0iMjU2IiBjeT0iMjIyIiByPSI4IiBmaWxsPSIjOTU3OGM0Ii8+CiAgPC9nPgogIDxnIGZpbGw9IiM3YTVhYTgiPgogICAgPHBhdGggZD0iTTI3MCAxNzAgUTI5MCAxNjAgMzEwIDE3MCBRMzEwIDE5NSAyOTAgMjAwIFEyNzAgMTk1IDI3MCAxNzAgWiIvPgogICAgPGNpcmNsZSBjeD0iMjgyIiBjeT0iMTc2IiByPSI4IiBmaWxsPSIjOTU3OGM0Ii8+CiAgICA8Y2lyY2xlIGN4PSIyOTYiIGN5PSIxODIiIHI9IjgiIGZpbGw9IiM5NTc4YzQiLz4KICA8L2c+CiAgPHRleHQgeD0iMjUwIiB5PSI0NzAiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjI2IiBmb250LXdlaWdodD0iNzAwIiBmaWxsPSIjNGEzODY4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5QdWxzZXM8L3RleHQ+Cjwvc3ZnPgo=',
  Spices: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MDAgNTAwIj4KICA8cmVjdCB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iI2ZiZWFlNiIvPgogIDxjaXJjbGUgY3g9IjQyMCIgY3k9IjkwIiByPSI0NiIgZmlsbD0iI2Y2ZDM2NSIvPgogIDxyZWN0IHg9IjAiIHk9IjQwMCIgd2lkdGg9IjUwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNhMTMwMWYiIG9wYWNpdHk9IjAuMTUiLz4KICA8bGluZSB4MT0iMTIwIiB5MT0iMTUwIiB4Mj0iMzgwIiB5Mj0iMTUwIiBzdHJva2U9IiM2YjQyMjYiIHN0cm9rZS13aWR0aD0iOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CiAgPGc+CiAgICA8cGF0aCBkPSJNMTYwIDE1MCBRMTUwIDIyMCAxNzAgMjcwIFExODUgMjkwIDE5NSAyNzAgUTIwNSAyMzAgMTkwIDE1MCBaIiBmaWxsPSIjZDE0NDJmIi8+CiAgICA8cGF0aCBkPSJNMTYwIDE1MCBRMTY1IDE0MCAxNzUgMTUwIiBzdHJva2U9IiMzZjdkMzIiIHN0cm9rZS13aWR0aD0iNiIgZmlsbD0ibm9uZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CiAgPC9nPgogIDxnPgogICAgPHBhdGggZD0iTTIzMCAxNTAgUTIxNSAyNDAgMjQwIDMwMCBRMjU1IDMyMCAyNjUgMzAwIFEyODAgMjQwIDI2NSAxNTAgWiIgZmlsbD0iI2UwNWEzNCIvPgogICAgPHBhdGggZD0iTTIzMCAxNTAgUTIzNyAxMzggMjQ4IDE1MCIgc3Ryb2tlPSIjM2Y3ZDMyIiBzdHJva2Utd2lkdGg9IjYiIGZpbGw9Im5vbmUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgogIDwvZz4KICA8Zz4KICAgIDxwYXRoIGQ9Ik0zMDAgMTUwIFEyOTAgMjEwIDMwNSAyNTUgUTMxNyAyNzMgMzI3IDI1NSBRMzQwIDIyMCAzMjggMTUwIFoiIGZpbGw9IiNkMTQ0MmYiLz4KICAgIDxwYXRoIGQ9Ik0zMDAgMTUwIFEzMDYgMTQwIDMxNiAxNTAiIHN0cm9rZT0iIzNmN2QzMiIgc3Ryb2tlLXdpZHRoPSI2IiBmaWxsPSJub25lIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KICA8L2c+CiAgPGc+CiAgICA8cGF0aCBkPSJNMzYwIDE1MCBRMzUwIDIwMCAzNjIgMjM1IFEzNzIgMjUwIDM4MCAyMzUgUTM5MCAyMDUgMzgwIDE1MCBaIiBmaWxsPSIjZTA1YTM0Ii8+CiAgICA8cGF0aCBkPSJNMzYwIDE1MCBRMzY1IDE0MSAzNzMgMTUwIiBzdHJva2U9IiMzZjdkMzIiIHN0cm9rZS13aWR0aD0iNiIgZmlsbD0ibm9uZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CiAgPC9nPgogIDx0ZXh0IHg9IjI1MCIgeT0iNDcwIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNiIgZm9udC13ZWlnaHQ9IjcwMCIgZmlsbD0iIzdhMjMxMyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U3BpY2VzPC90ZXh0Pgo8L3N2Zz4K',
  Oilseeds: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MDAgNTAwIj4KICA8cmVjdCB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iI2Y0ZjZkZiIvPgogIDxyZWN0IHg9IjAiIHk9IjQwMCIgd2lkdGg9IjUwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiM2YjdhMmYiLz4KICA8bGluZSB4MT0iMjUwIiB5MT0iNDAwIiB4Mj0iMjUwIiB5Mj0iMjMwIiBzdHJva2U9IiM1YzZiMWUiIHN0cm9rZS13aWR0aD0iMTAiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgogIDxnIGZpbGw9IiNmMmIyM2MiPgogICAgPGVsbGlwc2UgY3g9IjI1MCIgY3k9IjE1MCIgcng9IjE4IiByeT0iNDYiIHRyYW5zZm9ybT0icm90YXRlKDAgMjUwIDE1MCkiLz4KICAgIDxlbGxpcHNlIGN4PSIyNTAiIGN5PSIxNTAiIHJ4PSIxOCIgcnk9IjQ2IiB0cmFuc2Zvcm09InJvdGF0ZSgzMCAyNTAgMTUwKSIvPgogICAgPGVsbGlwc2UgY3g9IjI1MCIgY3k9IjE1MCIgcng9IjE4IiByeT0iNDYiIHRyYW5zZm9ybT0icm90YXRlKDYwIDI1MCAxNTApIi8+CiAgICA8ZWxsaXBzZSBjeD0iMjUwIiBjeT0iMTUwIiByeD0iMTgiIHJ5PSI0NiIgdHJhbnNmb3JtPSJyb3RhdGUoOTAgMjUwIDE1MCkiLz4KICAgIDxlbGxpcHNlIGN4PSIyNTAiIGN5PSIxNTAiIHJ4PSIxOCIgcnk9IjQ2IiB0cmFuc2Zvcm09InJvdGF0ZSgxMjAgMjUwIDE1MCkiLz4KICAgIDxlbGxpcHNlIGN4PSIyNTAiIGN5PSIxNTAiIHJ4PSIxOCIgcnk9IjQ2IiB0cmFuc2Zvcm09InJvdGF0ZSgxNTAgMjUwIDE1MCkiLz4KICAgIDxlbGxpcHNlIGN4PSIyNTAiIGN5PSIxNTAiIHJ4PSIxOCIgcnk9IjQ2IiB0cmFuc2Zvcm09InJvdGF0ZSgxODAgMjUwIDE1MCkiLz4KICAgIDxlbGxpcHNlIGN4PSIyNTAiIGN5PSIxNTAiIHJ4PSIxOCIgcnk9IjQ2IiB0cmFuc2Zvcm09InJvdGF0ZSgyMTAgMjUwIDE1MCkiLz4KICAgIDxlbGxpcHNlIGN4PSIyNTAiIGN5PSIxNTAiIHJ4PSIxOCIgcnk9IjQ2IiB0cmFuc2Zvcm09InJvdGF0ZSgyNDAgMjUwIDE1MCkiLz4KICAgIDxlbGxpcHNlIGN4PSIyNTAiIGN5PSIxNTAiIHJ4PSIxOCIgcnk9IjQ2IiB0cmFuc2Zvcm09InJvdGF0ZSgyNzAgMjUwIDE1MCkiLz4KICAgIDxlbGxpcHNlIGN4PSIyNTAiIGN5PSIxNTAiIHJ4PSIxOCIgcnk9IjQ2IiB0cmFuc2Zvcm09InJvdGF0ZSgzMDAgMjUwIDE1MCkiLz4KICAgIDxlbGxpcHNlIGN4PSIyNTAiIGN5PSIxNTAiIHJ4PSIxOCIgcnk9IjQ2IiB0cmFuc2Zvcm09InJvdGF0ZSgzMzAgMjUwIDE1MCkiLz4KICA8L2c+CiAgPGNpcmNsZSBjeD0iMjUwIiBjeT0iMTUwIiByPSIzNCIgZmlsbD0iIzZiNDIyNiIvPgogIDxsaW5lIHgxPSIxODAiIHkxPSIzMzAiIHgyPSIyMDUiIHkyPSIyNzAiIHN0cm9rZT0iIzVjNmIxZSIgc3Ryb2tlLXdpZHRoPSI4IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KICA8bGluZSB4MT0iMzIwIiB5MT0iMzMwIiB4Mj0iMjk1IiB5Mj0iMjcwIiBzdHJva2U9IiM1YzZiMWUiIHN0cm9rZS13aWR0aD0iOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CiAgPGVsbGlwc2UgY3g9IjE3MCIgY3k9IjMzNSIgcng9IjIyIiByeT0iMTIiIGZpbGw9IiM3YThhM2EiLz4KICA8ZWxsaXBzZSBjeD0iMzMwIiBjeT0iMzM1IiByeD0iMjIiIHJ5PSIxMiIgZmlsbD0iIzdhOGEzYSIvPgogIDx0ZXh0IHg9IjI1MCIgeT0iNDcwIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNiIgZm9udC13ZWlnaHQ9IjcwMCIgZmlsbD0iIzNlNGExNSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+T2lsc2VlZHM8L3RleHQ+Cjwvc3ZnPgo=',
};
const imageFor = (category) => CATEGORY_IMAGE[category] ?? CATEGORY_IMAGE.Vegetables;

const LOCATIONS = ['Nashik, MH', 'Guntur, AP', 'Karnal, HR', 'Erode, TN', 'Indore, MP', 'Kolar, KA'];
const FARMERS = [
  { name: 'Ramesh Patil', phone: '9876500001' },
  { name: 'Lakshmi Reddy', phone: '9876500002' },
  { name: 'Suresh Yadav', phone: '9876500003' },
  { name: 'Kavita Naik', phone: '9876500004' },
  { name: 'Arjun Singh', phone: '9876500005' },
  { name: 'Meena Devi', phone: '9876500006' },
];
const AVATAR_COLORS = ['#2E5E3E', '#C4871F', '#3E7A52', '#C1442E', '#1F3D2B', '#E2A33D'];

const PESTICIDES = [
  { name: 'Imidacloprid 17.8% SL', category: 'Vegetables', crops: ['Tomatoes', 'Onions', 'Potatoes'], price: 420, unit: 'litre' },
  { name: 'Chlorpyrifos 20% EC', category: 'Grains', crops: ['Wheat', 'Basmati Rice', 'Cotton'], price: 310, unit: 'litre' },
  { name: 'Mancozeb 75% WP', category: 'Fruits', crops: ['Alphonso Mangoes', 'Bananas'], price: 260, unit: 'kg' },
  { name: 'Copper Oxychloride 50% WP', category: 'Spices', crops: ['Red Chilli', 'Turmeric', 'Green Chilli'], price: 240, unit: 'kg' },
  { name: 'Carbendazim 50% WP', category: 'Pulses', crops: ['Tur Dal', 'Chickpeas'], price: 280, unit: 'kg' },
  { name: 'Neem Oil 1500 ppm', category: 'All', crops: ['Tomatoes', 'Onions', 'Alphonso Mangoes', 'Red Chilli'], price: 380, unit: 'litre' },
  { name: 'Glyphosate 41% SL', category: 'Grains', crops: ['Sugarcane', 'Cotton', 'Wheat'], price: 350, unit: 'litre' },
  { name: 'Propiconazole 25% EC', category: 'Grains', crops: ['Basmati Rice', 'Wheat'], price: 610, unit: 'litre' },
  { name: 'Sulphur 80% WDG', category: 'Fruits', crops: ['Alphonso Mangoes', 'Bananas', 'Potatoes'], price: 190, unit: 'kg' },
];

async function ensureAdmin() {
  const phone = process.env.SEED_ADMIN_PHONE || '6302350963';
  const name = process.env.SEED_ADMIN_NAME || 'Platform Admin';
  const existing = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
  if (existing.rows.length > 0) {
    if (existing.rows[0].role !== 'admin') {
      await pool.query('UPDATE users SET role = $1 WHERE phone = $2', ['admin', phone]);
      console.log(`🔧 Existing user ${phone} promoted to admin.`);
    } else {
      console.log(`✅ Admin ${phone} already exists.`);
    }
    return existing.rows[0].id;
  }
  const result = await pool.query(
    `INSERT INTO users (phone, name, role, location, avatar_color) VALUES ($1,$2,'admin',$3,$4) RETURNING id`,
    [phone, name, 'Hyderabad, TS', '#12241A']
  );
  console.log(`✅ Created admin account for +91 ${phone} (${name}).`);
  return result.rows[0].id;
}

async function ensureFarmers() {
  const ids = [];
  for (let i = 0; i < FARMERS.length; i++) {
    const f = FARMERS[i];
    const existing = await pool.query('SELECT id FROM users WHERE phone = $1', [f.phone]);
    if (existing.rows.length > 0) {
      ids.push(existing.rows[0].id);
      continue;
    }
    const result = await pool.query(
      `INSERT INTO users (phone, name, role, location, avatar_color) VALUES ($1,$2,'farmer',$3,$4) RETURNING id`,
      [f.phone, f.name, LOCATIONS[i % LOCATIONS.length], AVATAR_COLORS[i % AVATAR_COLORS.length]]
    );
    ids.push(result.rows[0].id);
  }
  console.log(`✅ ${ids.length} demo farmer accounts ready.`);
  return ids;
}

async function seedListings(farmerIds) {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM crop_listings');
  if (rows[0].count > 0) {
    console.log(`ℹ️  ${rows[0].count} listings already exist, skipping listing seed.`);
    return;
  }
  let created = 0;
  for (let i = 0; i < 48; i++) {
    const crop = CROPS[i % CROPS.length];
    const farmerId = farmerIds[i % farmerIds.length];
    const statuses = ['available', 'available', 'available', 'reserved', 'sold'];
    await pool.query(
      `INSERT INTO crop_listings
        (crop_name, category, quantity, unit, price_per_unit, harvest_date, location, status, image_url, description, farmer_id, interested_count)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        crop.name,
        crop.category,
        50 + ((i * 37) % 950),
        i % 3 === 0 ? 'ton' : 'kg',
        18 + ((i * 13) % 82),
        new Date(Date.now() - ((i * 5) % 60) * 86400000).toISOString().slice(0, 10),
        LOCATIONS[i % LOCATIONS.length],
        statuses[i % statuses.length],
        imageFor(crop.category),
        'Freshly harvested, sorted and graded. Available for immediate pickup or delivery within region.',
        farmerId,
        (i * 3) % 12,
      ]
    );
    created++;
  }
  console.log(`✅ Seeded ${created} crop listings with crop-matched images.`);
}

async function seedPesticides() {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM pesticide_prices');
  if (rows[0].count > 0) {
    console.log(`ℹ️  ${rows[0].count} pesticide entries already exist, skipping.`);
    return;
  }
  for (const p of PESTICIDES) {
    await pool.query(
      `INSERT INTO pesticide_prices (pesticide_name, crop_category, applicable_crops, price_per_unit, unit)
       VALUES ($1,$2,$3,$4,$5)`,
      [p.name, p.category, p.crops, p.price, p.unit]
    );
  }
  console.log(`✅ Seeded ${PESTICIDES.length} pesticide price entries.`);
}

async function main() {
  console.log('🌱 Seeding Farmer Market Connect database…');
  await ensureAdmin();
  const farmerIds = await ensureFarmers();
  await seedListings(farmerIds);
  await seedPesticides();
  console.log('🌾 Done.');
  await pool.end();
}

main().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});