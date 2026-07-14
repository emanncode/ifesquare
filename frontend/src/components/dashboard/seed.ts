import type { DayEntry, Product } from "./types"

export const seedProducts: Product[] = [
  { id: "p1", name: "Visco 2000 4L", unit: "bottle", stock: 24, price: 4200 },
  { id: "p2", name: "Super V 1L", unit: "bottle", stock: 36, price: 1850 },
  {
    id: "p3",
    name: "Diesel Motor Oil 4L",
    unit: "bottle",
    stock: 15,
    price: 5600,
  },
  { id: "p4", name: "Hydraulic Oil 20L", unit: "drum", stock: 6, price: 18500 },
  { id: "p5", name: "Gear Oil 1L", unit: "bottle", stock: 42, price: 1200 },
]

export const seedEntries: Record<string, DayEntry> = {
  p1: { receipts: "6", closing: "18" },
  p2: { receipts: "12", closing: "29" },
  p3: { receipts: "0", closing: "11" },
  p4: { receipts: "2", closing: "5" },
  p5: { receipts: "0", closing: "38" },
}
