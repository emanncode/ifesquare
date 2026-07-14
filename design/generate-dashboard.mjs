#!/usr/bin/env node
/**
 * Generates design/ifesquare-dashboard.pen — open in Pencil (VS Code) to view/edit.
 * Uses shadcn_lib.pen imports via ref prefix "s:".
 */
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));

const GREEN = {
  50: "#F0F9F3",
  100: "#D9F0E2",
  400: "#2DB85A",
  500: "#009B4D",
  600: "#00843D",
  700: "#006B32",
  800: "#005228",
};

const text = (name, content, opts = {}) => ({
  type: "text",
  name,
  fill: opts.fill ?? "#18181b",
  content,
  fontFamily: "Inter",
  fontSize: opts.fontSize ?? 14,
  fontWeight: opts.fontWeight ?? "normal",
  lineHeight: opts.lineHeight ?? 1.43,
  ...(opts.textGrowth ? { textGrowth: opts.textGrowth } : {}),
  ...(opts.width ? { width: opts.width } : {}),
  ...(opts.textAlign ? { textAlign: opts.textAlign } : {}),
});

const icon = (name, iconName, fill = "#71717a") => ({
  type: "icon",
  name,
  width: 16,
  height: 16,
  icon: iconName,
  library: "lucide",
  fill,
});

let _idSeq = 0;
function assignIds(node, seen = new Set()) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach((n) => assignIds(n, seen));
    return;
  }
  if ((node.type || node.ref) && !node.id) {
    let id;
    do {
      id = `g${(_idSeq++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    } while (seen.has(id));
    node.id = id;
    seen.add(id);
  } else if (node.id) {
    seen.add(node.id);
  }
  if (node.children) assignIds(node.children, seen);
  if (node.descendants) assignIds(Object.values(node.descendants), seen);
}

function normalizePenNode(node) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach(normalizePenNode);
    return;
  }
  if (node.type === "icon_font") {
    node.type = "icon";
    node.icon = node.iconFontName;
    node.library = "lucide";
    delete node.iconFontName;
    delete node.iconFontFamily;
  }
  if (node.fill === "transparent") node.fill = "#00000000";
  if (
    node.stroke &&
    typeof node.stroke === "object" &&
    !Array.isArray(node.stroke) &&
    ("align" in node.stroke || "thickness" in node.stroke)
  ) {
    const s = node.stroke;
    node.stroke = s.fill ?? GREEN[100];
    node.strokeAlignment = s.align === "center" ? "center" : "inner";
    if (s.thickness !== undefined) node.strokeWidth = s.thickness;
  }
  if (node.children) node.children.forEach(normalizePenNode);
  if (node.descendants) Object.values(node.descendants).forEach(normalizePenNode);
}

function finalizeDocument(doc) {
  doc.version = "2.14";
  doc.imports = { s: "shadcn_lib.pen" };
  normalizePenNode(doc);
  assignIds(doc);
}

const brandMark = () => ({
  type: "frame",
  name: "Brand Mark",
  width: 36,
  height: 36,
  cornerRadius: 10,
  layout: "none",
  children: [
    {
      type: "rectangle",
      name: "Mark BG",
      x: 0,
      y: 0,
      width: 36,
      height: 36,
      cornerRadius: 10,
      fill: GREEN[500],
    },
    {
      type: "frame",
      name: "Mark Inner",
      x: 4,
      y: 4,
      width: 28,
      height: 28,
      cornerRadius: 8,
      fill: "#FFFFFF",
      layout: "horizontal",
      justifyContent: "center",
      alignItems: "center",
      children: [
        text("IS", "IS", { fontSize: 11, fontWeight: "700", fill: GREEN[700] }),
      ],
    },
  ],
});

function sidebarNav(active) {
  const items = [
    { id: "ledger", label: "Today's ledger", icon: "book-open", route: "/" },
    { id: "products", label: "Products", icon: "package", route: "/products" },
    { id: "history", label: "History", icon: "history", route: "/history" },
  ];
  return {
    type: "frame",
    name: "Sidebar",
    width: 220,
    height: "fill_container",
    fill: "#FFFFFF",
    stroke: { align: "inside", thickness: { right: 1 }, fill: GREEN[100] },
    layout: "vertical",
    padding: [20, 16],
    gap: 28,
    children: [
      {
        type: "frame",
        name: "Sidebar Brand",
        layout: "horizontal",
        gap: 10,
        alignItems: "center",
        width: "fill_container",
        children: [
          brandMark(),
          {
            type: "frame",
            name: "Brand Text",
            layout: "vertical",
            gap: 2,
            children: [
              text("Brand Name", "Ifesquare", {
                fontSize: 14,
                fontWeight: "600",
                fill: GREEN[800],
              }),
              text("Tagline", "Built for Mum's shop", {
                fontSize: 11,
                fill: "#71717a",
              }),
            ],
          },
        ],
      },
      {
        type: "frame",
        name: "Nav",
        layout: "vertical",
        gap: 4,
        width: "fill_container",
        children: items.map((item) => ({
          type: "frame",
          name: `Nav ${item.label}`,
          width: "fill_container",
          cornerRadius: 10,
          fill: active === item.id ? GREEN[50] : "transparent",
          layout: "horizontal",
          gap: 10,
          padding: [10, 12],
          alignItems: "center",
          children: [
            icon(`${item.label} Icon`, item.icon, active === item.id ? GREEN[600] : "#71717a"),
            text(`${item.label} Label`, item.label, {
              fontSize: 14,
              fontWeight: active === item.id ? "500" : "normal",
              fill: active === item.id ? GREEN[800] : "#52525b",
            }),
          ],
        })),
      },
      {
        type: "frame",
        name: "Sidebar Spacer",
        width: "fill_container",
        height: "fill_container",
      },
      text("Sidebar Footer", "One shop · One login", {
        fontSize: 11,
        fill: "#71717a",
      }),
    ],
  };
}

function metricCard(label, value, hint) {
  return {
    type: "ref",
    ref: "s:pcGlv",
    name: `Metric ${label}`,
    width: "fill_container",
    descendants: {
      CgJv7: {
        height: "fit_content",
        padding: [20, 20, 8, 20],
        layout: "vertical",
        gap: 6,
        children: [
          text("Metric Label", label.toUpperCase(), {
            fontSize: 11,
            fontWeight: "500",
            fill: GREEN[600],
          }),
          text("Metric Value", value, {
            fontSize: 28,
            fontWeight: "600",
            fill: GREEN[800],
          }),
          text("Metric Hint", hint, { fontSize: 12, fill: "#71717a" }),
        ],
      },
      frWPV: { enabled: false },
      bvhSM: { enabled: false },
    },
  };
}

function tableCell(content, opts = {}) {
  return {
    type: "frame",
    name: opts.name ?? "Cell",
    width: opts.width ?? "fill_container",
    height: 44,
    layout: "horizontal",
    padding: [0, 12],
    alignItems: "center",
    justifyContent: opts.align === "right" ? "end" : "start",
    children: [
      opts.editable
        ? {
            type: "frame",
            name: "Editable Value",
            layout: "vertical",
            gap: 2,
            children: [
              text("Value", content, {
                fontSize: 13,
                fontWeight: opts.bold ? "600" : "normal",
                fill: opts.fill ?? "#18181b",
                textAlign: opts.align === "right" ? "right" : "left",
              }),
              {
                type: "rectangle",
                name: "Underline",
                width: opts.underlineWidth ?? 32,
                height: 1,
                fill: GREEN[100],
              },
            ],
          }
        : text("Value", content, {
            fontSize: 13,
            fontWeight: opts.bold ? "600" : "normal",
            fill: opts.fill ?? (opts.muted ? "#71717a" : "#18181b"),
            textAlign: opts.align === "right" ? "right" : "left",
          }),
    ],
  };
}

function ledgerTable() {
  const cols = [
    { key: "product", label: "Product", width: "fill_container" },
    { key: "unit", label: "Unit", width: 56 },
    { key: "opening", label: "Opening", width: 64, align: "right" },
    { key: "receipts", label: "Receipts", width: 72, align: "right" },
    { key: "total", label: "Total", width: 56, align: "right" },
    { key: "closing", label: "Closing", width: 72, align: "right" },
    { key: "sales", label: "Sales", width: 56, align: "right" },
    { key: "price", label: "Price", width: 80, align: "right" },
    { key: "amount", label: "Amount", width: 96, align: "right" },
    { key: "delete", label: "", width: 40 },
  ];

  const rows = [
    { product: "Visco 2000 4L", unit: "bottle", opening: "24", receipts: "6", total: "30", closing: "18", sales: "12", price: "₦4,200", amount: "₦50,400" },
    { product: "Super V 1L", unit: "bottle", opening: "36", receipts: "12", total: "48", closing: "29", sales: "19", price: "₦1,850", amount: "₦35,150" },
    { product: "Diesel Motor Oil 4L", unit: "bottle", opening: "15", receipts: "0", total: "15", closing: "11", sales: "4", price: "₦5,600", amount: "₦22,400" },
    { product: "Hydraulic Oil 20L", unit: "drum", opening: "6", receipts: "2", total: "8", closing: "5", sales: "3", price: "₦18,500", amount: "₦55,500" },
    { product: "Gear Oil 1L", unit: "bottle", opening: "42", receipts: "0", total: "42", closing: "38", sales: "4", price: "₦1,200", amount: "₦4,800" },
  ];

  const cellStyle = {
    product: { bold: true, fill: GREEN[800] },
    unit: { muted: true },
    opening: { muted: true },
    receipts: { editable: true, underlineWidth: 24 },
    total: { muted: true },
    closing: { editable: true, underlineWidth: 24 },
    sales: { fill: GREEN[600], bold: true },
    price: { editable: true, underlineWidth: 48 },
    amount: { fill: GREEN[800], bold: true },
  };

  const headerRow = {
    type: "frame",
    name: "Table Header Row",
    width: "fill_container",
    height: 40,
    layout: "horizontal",
    alignItems: "center",
    fill: GREEN[50],
    stroke: { align: "inside", thickness: { bottom: 1 }, fill: GREEN[100] },
    children: cols.map((c) =>
      c.key === "delete"
        ? { type: "frame", name: "Header Delete", width: c.width, height: 40 }
        : tableCell(c.label, {
            name: `Header ${c.label}`,
            width: c.width,
            align: c.align,
            muted: true,
            fill: GREEN[700],
          })
    ),
  };

  const dataRows = rows.map((row, i) => ({
    type: "frame",
    name: `Ledger Row ${i + 1}`,
    width: "fill_container",
    height: 44,
    layout: "horizontal",
    alignItems: "center",
    fill: i % 2 === 0 ? "#FFFFFF" : "#FAFAFA",
    stroke: { align: "inside", thickness: { bottom: 1 }, fill: "#f4f4f5" },
    children: [
      ...cols
        .filter((c) => c.key !== "delete")
        .map((c) =>
          tableCell(row[c.key], {
            width: c.width,
            align: c.align,
            ...(cellStyle[c.key] || {}),
          })
        ),
      {
        type: "frame",
        name: "Delete Cell",
        width: 40,
        height: 44,
        layout: "horizontal",
        justifyContent: "center",
        alignItems: "center",
        children: [icon("Delete", "trash-2", "#71717a")],
      },
    ],
  }));

  return {
    type: "frame",
    name: "Ledger Table",
    width: "fill_container",
    cornerRadius: 10,
    fill: "#FFFFFF",
    stroke: { align: "inside", thickness: 1, fill: GREEN[100] },
    layout: "vertical",
    clip: true,
    children: [headerRow, ...dataRows],
  };
}

function barChart() {
  const data = [
    { name: "Visco 2000", value: 50400, h: 140 },
    { name: "Hydraulic 20L", value: 55500, h: 155 },
    { name: "Super V 1L", value: 35150, h: 98 },
    { name: "Diesel 4L", value: 22400, h: 62 },
    { name: "Gear Oil", value: 4800, h: 18 },
  ];
  return {
    type: "frame",
    name: "BarChart (Recharts)",
    width: "fill_container",
    height: 220,
    layout: "horizontal",
    gap: 16,
    alignItems: "end",
    padding: [16, 24, 0, 24],
    children: data.map((d) => ({
      type: "frame",
      name: `Bar ${d.name}`,
      width: "fill_container",
      layout: "vertical",
      gap: 8,
      alignItems: "center",
      justifyContent: "end",
      height: "fill_container",
      children: [
        {
          type: "rectangle",
          name: "Bar",
          width: 48,
          height: d.h,
          cornerRadius: [4, 4, 0, 0],
          fill: GREEN[500],
        },
        text("Bar Label", d.name, { fontSize: 11, fill: "#71717a", textAlign: "center", textGrowth: "fixed-width", width: 72 }),
      ],
    })),
  };
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutSlicePath(cx, cy, rOuter, rInner, startAngle, endAngle) {
  const startOuter = polarToCartesian(cx, cy, rOuter, startAngle);
  const endOuter = polarToCartesian(cx, cy, rOuter, endAngle);
  const endInner = polarToCartesian(cx, cy, rInner, endAngle);
  const startInner = polarToCartesian(cx, cy, rInner, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${startOuter.x.toFixed(2)} ${startOuter.y.toFixed(2)}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${endOuter.x.toFixed(2)} ${endOuter.y.toFixed(2)}`,
    `L ${endInner.x.toFixed(2)} ${endInner.y.toFixed(2)}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${startInner.x.toFixed(2)} ${startInner.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

function donutSegments(segments, size = 160, innerRatio = 0.55) {
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2;
  const rInner = rOuter * innerRatio;
  let cursor = 0;
  return segments.map((s) => {
    const sweep = (s.pctValue / 100) * 360;
    const start = cursor;
    const end = cursor + sweep;
    cursor = end;
    return {
      type: "path",
      name: `Donut Segment ${s.label}`,
      width: size,
      height: size,
      viewBox: [0, 0, size, size],
      fill: s.color,
      geometry: donutSlicePath(cx, cy, rOuter, rInner, start, end),
    };
  });
}

function pieChart() {
  const segments = [
    { label: "Visco 2000 4L", pct: "38%", pctValue: 38, color: GREEN[500] },
    { label: "Hydraulic Oil 20L", pct: "28%", pctValue: 28, color: GREEN[600] },
    { label: "Super V 1L", pct: "22%", pctValue: 22, color: GREEN[400] },
    { label: "Other", pct: "12%", pctValue: 12, color: GREEN[100] },
  ];
  return {
    type: "frame",
    name: "PieChart (Recharts)",
    width: "fill_container",
    height: 220,
    layout: "horizontal",
    gap: 32,
    alignItems: "center",
    padding: [16, 24],
    children: [
      {
        type: "frame",
        name: "Donut",
        width: 160,
        height: 160,
        layout: "none",
        children: donutSegments(segments),
      },
      {
        type: "frame",
        name: "Pie Legend",
        layout: "vertical",
        gap: 10,
        children: segments.map((s) => ({
          type: "frame",
          name: `Legend ${s.label}`,
          layout: "horizontal",
          gap: 8,
          alignItems: "center",
          children: [
            { type: "rectangle", name: "Swatch", width: 10, height: 10, cornerRadius: 2, fill: s.color },
            text("Legend Label", `${s.label} · ${s.pct}`, { fontSize: 12, fill: "#52525b" }),
          ],
        })),
      },
    ],
  };
}

function lineChart() {
  return {
    type: "frame",
    name: "LineChart (Recharts)",
    width: "fill_container",
    height: 220,
    layout: "none",
    padding: [16, 24],
    children: [
      {
        type: "path",
        name: "Trend Line",
        width: 960,
        height: 180,
        viewBox: [0, 0, 960, 180],
        stroke: GREEN[500],
        strokeWidth: 2,
        strokeAlignment: "center",
        geometry: "M 0 140 L 160 120 L 320 130 L 480 90 L 640 100 L 800 60 L 960 45",
      },
      ...["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => ({
        type: "text",
        name: `Day ${day}`,
        x: 24 + i * 136,
        y: 196,
        fill: "#71717a",
        content: day,
        fontFamily: "Inter",
        fontSize: 11,
      })),
    ],
  };
}

function shadcnTabs(activeTab = "bar") {
  const tabs = [
    { id: "bar", label: "Top products" },
    { id: "pie", label: "Revenue share" },
    { id: "line", label: "Revenue trend" },
  ];
  return {
    type: "ref",
    ref: "s:PbofX",
    name: "Insights Tabs",
    width: "fit_content",
    children: tabs.map((t) => ({
      type: "ref",
      ref: t.id === activeTab ? "s:coMmv" : "s:QY0Ka",
      name: `Tab ${t.label}`,
      descendants: {
        qYQHc: {
          content: t.label,
          ...(t.id === activeTab ? { fill: GREEN[800] } : {}),
        },
      },
    })),
  };
}

function insightsCard(activeTab = "bar") {
  const chart =
    activeTab === "pie" ? pieChart() : activeTab === "line" ? lineChart() : barChart();

  return {
    type: "ref",
    ref: "s:pcGlv",
    name: "Insights Card",
    width: "fill_container",
    descendants: {
      CgJv7: {
        height: "fit_content",
        padding: [20, 24, 12, 24],
        layout: "horizontal",
        justifyContent: "space_between",
        alignItems: "center",
        width: "fill_container",
        children: [
          text("Insights Title", "Insights", { fontSize: 16, fontWeight: "600", fill: GREEN[800] }),
          shadcnTabs(activeTab),
        ],
      },
      frWPV: {
        enabled: true,
        height: "fit_content",
        padding: [0, 0, 16, 0],
        layout: "vertical",
        children: [chart],
      },
      bvhSM: { enabled: false },
    },
  };
}

function primaryButton(label, large = false) {
  return {
    type: "ref",
    ref: large ? "s:C3KOZ" : "s:VSnC2",
    name: `Button ${label}`,
    descendants: {
      "8jVfJ": { enabled: false },
      "8tnXG": { content: label },
      ...(large ? { RO4Ll: { enabled: false } } : {}),
    },
    ...(large ? {} : {}),
  };
}

function outlineButton(label) {
  return {
    type: "ref",
    ref: "s:C10zH",
    name: `Button ${label}`,
    descendants: {
      "l8v2I": { enabled: false },
      "poRwU": { content: label },
    },
  };
}

function inputGroup(label, placeholder, width = "fill_container") {
  return {
    type: "ref",
    ref: "s:1415a",
    name: `Input ${label}`,
    width,
    descendants: {
      BX0XX: { children: [{ type: "text", fill: "#18181b", content: label, fontFamily: "Inter", fontSize: 14, fontWeight: "500" }] },
      SDRKn: { content: placeholder, fill: "#71717a" },
    },
  };
}

function routeNote(route) {
  return {
    type: "note",
    name: `Route ${route}`,
    content: `react-router: ${route}`,
    width: 160,
    height: 40,
  };
}

function loginScreen(x) {
  return {
    type: "frame",
    name: "Login — /login",
    x,
    y: 0,
    width: 1440,
    height: 900,
    fill: "#FFFFFF",
    clip: true,
    layout: "vertical",
    justifyContent: "center",
    alignItems: "center",
    children: [
      {
        type: "ref",
        ref: "s:pcGlv",
        name: "Login Card",
        width: 400,
        descendants: {
          CgJv7: {
            enabled: true,
            height: "fit_content",
            padding: [40, 40, 0, 40],
            layout: "vertical",
            gap: 8,
            alignItems: "center",
            children: [
              brandMark(),
              text("Login Title", "Ifesquare", { fontSize: 22, fontWeight: "600", fill: GREEN[800] }),
              text("Login Subtitle", "Sign in to your shop ledger", { fontSize: 14, fill: "#71717a" }),
            ],
          },
          frWPV: {
            enabled: true,
            height: "fit_content",
            padding: [24, 40],
            layout: "vertical",
            gap: 16,
            children: [
              inputGroup("Email", "mum@shop.ng"),
              inputGroup("Password", "••••••••"),
            ],
          },
          bvhSM: {
            enabled: true,
            padding: [0, 40, 40, 40],
            layout: "vertical",
            gap: 12,
            alignItems: "center",
            children: [
              {
                type: "ref",
                ref: "s:VSnC2",
                name: "Sign In Button",
                width: "fill_container",
                descendants: {
                  "8jVfJ": { enabled: false },
                  "8tnXG": { content: "Sign in" },
                },
              },
              text("Login Footer", "One shop. One login.", { fontSize: 12, fill: "#71717a" }),
            ],
          },
        },
      },
    ],
  };
}

function dashboardScreen(x) {
  return {
    type: "frame",
    name: "Dashboard — /",
    x,
    y: 0,
    width: 1440,
    height: 1200,
    fill: "#FFFFFF",
    clip: true,
    layout: "horizontal",
    children: [
      sidebarNav("ledger"),
      {
        type: "frame",
        name: "Main",
        width: "fill_container",
        height: "fill_container",
        layout: "vertical",
        gap: 24,
        padding: [28, 32],
        children: [
          {
            type: "frame",
            name: "Page Header",
            width: "fill_container",
            layout: "horizontal",
            justifyContent: "space_between",
            alignItems: "center",
            children: [
              {
                type: "frame",
                name: "Header Left",
                layout: "vertical",
                gap: 4,
                children: [
                  text("Page Title", "Today's ledger", { fontSize: 24, fontWeight: "600", fill: GREEN[800] }),
                  text("Page Date", "Sunday, 12 July 2026", { fontSize: 14, fill: "#71717a" }),
                ],
              },
              {
                type: "frame",
                name: "Header Actions",
                layout: "horizontal",
                gap: 12,
                alignItems: "center",
                children: [
                  outlineButton("Add product"),
                  {
                    type: "ref",
                    ref: "s:VSnC2",
                    name: "Close Day Button",
                    descendants: {
                      "8jVfJ": { enabled: false },
                      "8tnXG": { content: "Close & save day" },
                    },
                  },
                ],
              },
            ],
          },
          {
            type: "frame",
            name: "Metrics Row",
            width: "fill_container",
            layout: "horizontal",
            gap: 16,
            children: [
              metricCard("Today's revenue", "₦168,250", "from 42 units sold"),
              metricCard("Units sold", "42", "across 5 products"),
              metricCard("Top product", "Visco 2000 4L", "₦50,400 · 12 bottles"),
            ],
          },
          ledgerTable(),
          insightsCard("bar"),
        ],
      },
    ],
  };
}

function productsScreen(x) {
  const products = [
    ["Visco 2000 4L", "bottle", "18", "₦4,200"],
    ["Super V 1L", "bottle", "29", "₦1,850"],
    ["Diesel Motor Oil 4L", "bottle", "11", "₦5,600"],
    ["Hydraulic Oil 20L", "drum", "5", "₦18,500"],
    ["Gear Oil 1L", "bottle", "38", "₦1,200"],
    ["Engine Coolant 5L", "bottle", "14", "₦3,400"],
  ];

  return {
    type: "frame",
    name: "Products — /products",
    x,
    y: 0,
    width: 1440,
    height: 900,
    fill: "#FFFFFF",
    clip: true,
    layout: "horizontal",
    children: [
      sidebarNav("products"),
      {
        type: "frame",
        name: "Main",
        width: "fill_container",
        layout: "vertical",
        gap: 24,
        padding: [28, 32],
        children: [
          {
            type: "frame",
            name: "Page Header",
            width: "fill_container",
            layout: "horizontal",
            justifyContent: "space_between",
            alignItems: "center",
            children: [
              {
                type: "frame",
                name: "Header Left",
                layout: "vertical",
                gap: 4,
                children: [
                  text("Page Title", "Products", { fontSize: 24, fontWeight: "600", fill: GREEN[800] }),
                  text("Page Subtitle", "Names, units, prices, and running stock", { fontSize: 14, fill: "#71717a" }),
                ],
              },
              outlineButton("Add product"),
            ],
          },
          {
            type: "frame",
            name: "Products Table",
            width: "fill_container",
            cornerRadius: 10,
            fill: "#FFFFFF",
            stroke: { align: "inside", thickness: 1, fill: GREEN[100] },
            layout: "vertical",
            clip: true,
            children: [
              {
                type: "frame",
                name: "Products Header",
                width: "fill_container",
                height: 40,
                layout: "horizontal",
                fill: GREEN[50],
                stroke: { align: "inside", thickness: { bottom: 1 }, fill: GREEN[100] },
                alignItems: "center",
                children: [
                  tableCell("Product", { width: "fill_container", fill: GREEN[700] }),
                  tableCell("Unit", { width: 100, fill: GREEN[700] }),
                  tableCell("Running stock", { width: 120, align: "right", fill: GREEN[700] }),
                  tableCell("Price", { width: 140, align: "right", fill: GREEN[700] }),
                ],
              },
              ...products.map((row, i) => ({
                type: "frame",
                name: `Product Row ${row[0]}`,
                width: "fill_container",
                height: 48,
                layout: "horizontal",
                alignItems: "center",
                fill: i % 2 === 0 ? "#FFFFFF" : "#FAFAFA",
                stroke: { align: "inside", thickness: { bottom: 1 }, fill: "#f4f4f5" },
                children: [
                  tableCell(row[0], { width: "fill_container", bold: true, fill: GREEN[800] }),
                  tableCell(row[1], { width: 100, muted: true }),
                  tableCell(row[2], { width: 120, align: "right", muted: true }),
                  tableCell(row[3], { width: 140, align: "right", editable: true, underlineWidth: 56 }),
                ],
              })),
            ],
          },
        ],
      },
    ],
  };
}

function bulkInputCell(value, placeholder, width = "fill_container") {
  return {
    type: "ref",
    ref: "s:1415a",
    name: "Bulk Input",
    width,
    descendants: {
      BX0XX: { enabled: false },
      SDRKn: { content: value || placeholder, fill: value ? "#18181b" : "#71717a" },
    },
  };
}

function bulkAddProductsScreen(x, y) {
  const rows = [
    ["Visco 2000 4L", "bottle", "24", "4,200"],
    ["Super V 1L", "bottle", "36", "2,800"],
    ["Diesel Motor Oil 4L", "bottle", "12", "3,600"],
    ["Hydraulic Oil 20L", "drum", "6", "5,600"],
    ["", "", "", ""],
  ];
  const placeholders = ["e.g. Visco 2000 4L", "bottle", "0", "0"];
  const colWidths = ["fill_container", 100, 110, 120];

  const bulkRow = (row, i) => ({
    type: "frame",
    name: `Bulk Row ${i + 1}`,
    width: "fill_container",
    height: 52,
    layout: "horizontal",
    alignItems: "center",
    fill: i % 2 === 0 ? "#FFFFFF" : "#FAFAFA",
    stroke: { align: "inside", thickness: { bottom: 1 }, fill: "#f4f4f5" },
    children: [
      ...colWidths.map((w, c) => ({
        type: "frame",
        name: `Cell ${c}`,
        width: w,
        height: 52,
        layout: "horizontal",
        alignItems: "center",
        padding: [4, 8],
        children: [bulkInputCell(row[c], placeholders[c], "fill_container")],
      })),
      {
        type: "frame",
        name: "Delete Cell",
        width: 40,
        height: 52,
        layout: "horizontal",
        justifyContent: "center",
        alignItems: "center",
        children: [icon("Delete", "trash-2", i === rows.length - 1 ? "#d4d4d8" : "#71717a")],
      },
    ],
  });

  return {
    type: "frame",
    name: "Bulk Add Products — /products/bulk-add",
    x,
    y,
    width: 1440,
    height: 900,
    fill: "#FFFFFF",
    clip: true,
    layout: "horizontal",
    children: [
      sidebarNav("products"),
      {
        type: "frame",
        name: "Main",
        width: "fill_container",
        height: "fill_container",
        layout: "vertical",
        gap: 24,
        padding: [28, 32],
        children: [
          {
            type: "frame",
            name: "Page Header",
            width: "fill_container",
            layout: "horizontal",
            justifyContent: "space_between",
            alignItems: "center",
            children: [
              {
                type: "frame",
                name: "Header Left",
                layout: "vertical",
                gap: 4,
                children: [
                  text("Page Title", "Add products", { fontSize: 24, fontWeight: "600", fill: GREEN[800] }),
                  text("Page Subtitle", "Add several products to your catalogue at once", {
                    fontSize: 14,
                    fill: "#71717a",
                  }),
                ],
              },
              {
                type: "frame",
                name: "Header Actions",
                layout: "horizontal",
                gap: 12,
                alignItems: "center",
                children: [outlineButton("Cancel"), primaryButton("Add 4 products")],
              },
            ],
          },
          {
            type: "frame",
            name: "Bulk Table",
            width: "fill_container",
            cornerRadius: 10,
            fill: "#FFFFFF",
            stroke: { align: "inside", thickness: 1, fill: GREEN[100] },
            layout: "vertical",
            clip: true,
            children: [
              {
                type: "frame",
                name: "Bulk Table Header",
                width: "fill_container",
                height: 40,
                layout: "horizontal",
                alignItems: "center",
                fill: GREEN[50],
                stroke: { align: "inside", thickness: { bottom: 1 }, fill: GREEN[100] },
                children: [
                  tableCell("Product name", { width: "fill_container", fill: GREEN[700] }),
                  tableCell("Unit", { width: 100, fill: GREEN[700] }),
                  tableCell("Starting stock", { width: 110, align: "right", fill: GREEN[700] }),
                  tableCell("Price (₦)", { width: 120, align: "right", fill: GREEN[700] }),
                  { type: "frame", name: "Header Delete", width: 40, height: 40 },
                ],
              },
              ...rows.map(bulkRow),
            ],
          },
          {
            type: "frame",
            name: "Table Footer",
            width: "fill_container",
            layout: "horizontal",
            justifyContent: "space_between",
            alignItems: "center",
            children: [
              {
                type: "frame",
                name: "Add Row Button",
                layout: "horizontal",
                gap: 6,
                alignItems: "center",
                padding: [8, 14],
                cornerRadius: 10,
                stroke: { align: "inside", thickness: 1, fill: GREEN[100] },
                children: [
                  icon("Plus", "plus", GREEN[600]),
                  text("Add Row Label", "Add row", { fontSize: 14, fontWeight: "500", fill: GREEN[800] }),
                ],
              },
              text("Bulk Hint", "4 products ready · empty rows are ignored", { fontSize: 12, fill: "#71717a" }),
            ],
          },
        ],
      },
    ],
  };
}

function historyScreen(x) {
  const days = [
    { date: "Sat, 11 Jul 2026", revenue: "₦142,800", units: "38", expanded: true },
    { date: "Fri, 10 Jul 2026", revenue: "₦156,400", units: "41", expanded: false },
    { date: "Thu, 9 Jul 2026", revenue: "₦98,200", units: "27", expanded: false },
    { date: "Wed, 8 Jul 2026", revenue: "₦175,600", units: "44", expanded: false },
  ];

  const expandedRows = [
    ["Visco 2000 4L", "12", "₦50,400"],
    ["Super V 1L", "15", "₦27,750"],
    ["Diesel Motor Oil 4L", "6", "₦33,600"],
    ["Hydraulic Oil 20L", "2", "₦37,000"],
  ];

  return {
    type: "frame",
    name: "History — /history",
    x,
    y: 0,
    width: 1440,
    height: 1000,
    fill: "#FFFFFF",
    clip: true,
    layout: "horizontal",
    children: [
      sidebarNav("history"),
      {
        type: "frame",
        name: "Main",
        width: "fill_container",
        layout: "vertical",
        gap: 24,
        padding: [28, 32],
        children: [
          {
            type: "frame",
            name: "Page Header",
            layout: "vertical",
            gap: 4,
            children: [
              text("Page Title", "History", { fontSize: 24, fontWeight: "600", fill: GREEN[800] }),
              text("Page Subtitle", "Past closed days — tap a row to see the breakdown", { fontSize: 14, fill: "#71717a" }),
            ],
          },
          {
            type: "frame",
            name: "History List",
            width: "fill_container",
            layout: "vertical",
            gap: 8,
            children: days.map((day) => ({
              type: "frame",
              name: `Day ${day.date}`,
              width: "fill_container",
              cornerRadius: 10,
              fill: "#FFFFFF",
              stroke: { align: "inside", thickness: 1, fill: GREEN[100] },
              layout: "vertical",
              children: [
                {
                  type: "frame",
                  name: "Day Summary Row",
                  width: "fill_container",
                  layout: "horizontal",
                  padding: [16, 20],
                  alignItems: "center",
                  gap: 16,
                  children: [
                    icon("Chevron", day.expanded ? "chevron-down" : "chevron-right", GREEN[600]),
                    text("Date", day.date, { fontSize: 14, fontWeight: "500", fill: GREEN[800], width: "fill_container", textGrowth: "fixed-width" }),
                    text("Revenue", day.revenue, { fontSize: 14, fontWeight: "600", fill: GREEN[800] }),
                    text("Units", `${day.units} units`, { fontSize: 13, fill: "#71717a" }),
                  ],
                },
                ...(day.expanded
                  ? [
                      {
                        type: "frame",
                        name: "Day Breakdown",
                        width: "fill_container",
                        layout: "vertical",
                        fill: GREEN[50],
                        padding: [0, 20, 16, 52],
                        gap: 0,
                        children: [
                          {
                            type: "frame",
                            name: "Breakdown Header",
                            width: "fill_container",
                            height: 32,
                            layout: "horizontal",
                            alignItems: "center",
                            children: [
                              tableCell("Product", { width: "fill_container", fill: GREEN[700], muted: true }),
                              tableCell("Sold", { width: 80, align: "right", fill: GREEN[700], muted: true }),
                              tableCell("Amount", { width: 120, align: "right", fill: GREEN[700], muted: true }),
                            ],
                          },
                          ...expandedRows.map((row, i) => ({
                            type: "frame",
                            name: `Breakdown Row ${i}`,
                            width: "fill_container",
                            height: 36,
                            layout: "horizontal",
                            alignItems: "center",
                            children: [
                              tableCell(row[0], { width: "fill_container" }),
                              tableCell(row[1], { width: 80, align: "right", muted: true }),
                              tableCell(row[2], { width: 120, align: "right", bold: true, fill: GREEN[800] }),
                            ],
                          })),
                        ],
                      },
                    ]
                  : []),
              ],
            })),
          },
        ],
      },
    ],
  };
}

function addProductDialog(x, y, label = "Add Product Dialog (overlay)") {
  return {
    type: "frame",
    name: label,
    x,
    y,
    width: 1440,
    height: 900,
    fill: "#00000040",
    layout: "vertical",
    justifyContent: "center",
    alignItems: "center",
    children: [
      {
        type: "ref",
        ref: "s:OtykB",
        name: "Add Product Dialog",
        width: 440,
        descendants: {
          CuAfb: { content: "Add product" },
          jBiwY: { content: "Add a product to today's ledger and your product list." },
          frWPV: {
            enabled: true,
            layout: "vertical",
            gap: 16,
            padding: [0, 24, 8, 24],
            height: "fit_content",
            children: [
              inputGroup("Product name", "e.g. Visco 2000 4L"),
              {
                type: "frame",
                name: "Dialog Row",
                layout: "horizontal",
                gap: 16,
                width: "fill_container",
                children: [
                  inputGroup("Unit", "bottle", "fill_container"),
                  inputGroup("Starting stock", "0", "fill_container"),
                ],
              },
              inputGroup("Price (₦)", "4,200"),
            ],
          },
          bvhSM: {
            children: [
              {
                type: "ref",
                ref: "s:C10zH",
                descendants: { "l8v2I": { enabled: false }, "poRwU": { content: "Cancel" } },
              },
              {
                type: "ref",
                ref: "s:VSnC2",
                descendants: { "8jVfJ": { enabled: false }, "8tnXG": { content: "Add product" } },
              },
            ],
          },
        },
      },
    ],
  };
}

function addProductSheetMobile(x, y) {
  const sheetHeight = 560;
  return {
    type: "frame",
    name: "Add Product Dialog — mobile (bottom sheet)",
    x,
    y,
    width: 390,
    height: 844,
    fill: "#00000040",
    clip: true,
    layout: "vertical",
    justifyContent: "end",
    children: [
      {
        type: "frame",
        name: "Bottom Sheet",
        width: "fill_container",
        height: sheetHeight,
        fill: "#FFFFFF",
        cornerRadius: [20, 20, 0, 0],
        layout: "vertical",
        children: [
          {
            type: "frame",
            name: "Sheet Grabber Row",
            width: "fill_container",
            layout: "horizontal",
            justifyContent: "center",
            padding: [10, 0],
            children: [
              { type: "rectangle", name: "Grabber", width: 36, height: 4, cornerRadius: 2, fill: GREEN[100] },
            ],
          },
          {
            type: "frame",
            name: "Sheet Header",
            width: "fill_container",
            layout: "vertical",
            gap: 4,
            padding: [4, 20, 16, 20],
            children: [
              text("Sheet Title", "Add product", { fontSize: 18, fontWeight: "600", fill: GREEN[800] }),
              text("Sheet Subtitle", "Add a product to today's ledger and your product list.", { fontSize: 13, fill: "#71717a" }),
            ],
          },
          {
            type: "frame",
            name: "Sheet Fields",
            width: "fill_container",
            layout: "vertical",
            gap: 14,
            padding: [0, 20],
            children: [
              inputGroup("Product name", "e.g. Visco 2000 4L"),
              {
                type: "frame",
                name: "Sheet Row",
                layout: "horizontal",
                gap: 16,
                width: "fill_container",
                children: [
                  inputGroup("Unit", "bottle", "fill_container"),
                  inputGroup("Starting stock", "0", "fill_container"),
                ],
              },
              inputGroup("Price (₦)", "4,200"),
            ],
          },
          {
            type: "frame",
            name: "Sheet Spacer",
            width: "fill_container",
            height: "fill_container",
          },
          {
            type: "frame",
            name: "Sheet Actions",
            width: "fill_container",
            layout: "vertical",
            gap: 10,
            padding: [16, 20, 28, 20],
            children: [
              {
                type: "ref",
                ref: "s:VSnC2",
                name: "Sheet Add Button",
                width: "fill_container",
                descendants: { "8jVfJ": { enabled: false }, "8tnXG": { content: "Add product" } },
              },
              {
                type: "ref",
                ref: "s:C10zH",
                name: "Sheet Cancel Button",
                width: "fill_container",
                descendants: { "l8v2I": { enabled: false }, "poRwU": { content: "Cancel" } },
              },
            ],
          },
        ],
      },
    ],
  };
}

function mobileNavDrawer(x, y) {
  const items = [
    { label: "Today's ledger", icon: "book-open", active: true },
    { label: "Products", icon: "package", active: false },
    { label: "History", icon: "history", active: false },
  ];
  return {
    type: "frame",
    name: "Nav Drawer — mobile",
    x,
    y,
    width: 390,
    height: 844,
    fill: "#00000040",
    clip: true,
    layout: "horizontal",
    justifyContent: "end",
    children: [
      {
        type: "frame",
        name: "Drawer Panel",
        width: 280,
        height: "fill_container",
        fill: "#FFFFFF",
        layout: "vertical",
        padding: [24, 20],
        gap: 28,
        children: [
          {
            type: "frame",
            name: "Drawer Brand",
            layout: "horizontal",
            gap: 10,
            alignItems: "center",
            children: [
              brandMark(),
              {
                type: "frame",
                name: "Drawer Brand Text",
                layout: "vertical",
                gap: 2,
                children: [
                  text("Brand Name", "Ifesquare", { fontSize: 14, fontWeight: "600", fill: GREEN[800] }),
                  text("Tagline", "Built for Mum's shop", { fontSize: 11, fill: "#71717a" }),
                ],
              },
            ],
          },
          {
            type: "frame",
            name: "Drawer Nav",
            layout: "vertical",
            gap: 4,
            width: "fill_container",
            children: items.map((item) => ({
              type: "frame",
              name: `Drawer Nav ${item.label}`,
              width: "fill_container",
              cornerRadius: 10,
              fill: item.active ? GREEN[50] : "#00000000",
              layout: "horizontal",
              gap: 10,
              padding: [10, 12],
              alignItems: "center",
              children: [
                icon(`${item.label} Icon`, item.icon, item.active ? GREEN[600] : "#71717a"),
                text(`${item.label} Label`, item.label, {
                  fontSize: 14,
                  fontWeight: item.active ? "500" : "normal",
                  fill: item.active ? GREEN[800] : "#52525b",
                }),
              ],
            })),
          },
          { type: "frame", name: "Drawer Spacer", width: "fill_container", height: "fill_container" },
          {
            type: "frame",
            name: "Drawer Nav Signout",
            width: "fill_container",
            layout: "horizontal",
            gap: 10,
            padding: [10, 12],
            alignItems: "center",
            children: [
              icon("Sign out Icon", "log-out", "#71717a"),
              text("Sign out Label", "Sign out", { fontSize: 14, fill: "#52525b" }),
            ],
          },
        ],
      },
    ],
  };
}

function mobileLoginScreen(x, y) {
  return {
    type: "frame",
    name: "Login — mobile",
    x,
    y,
    width: 390,
    height: 844,
    fill: "#FFFFFF",
    clip: true,
    layout: "vertical",
    justifyContent: "center",
    padding: [24, 20],
    children: [
      {
        type: "ref",
        ref: "s:pcGlv",
        name: "Login Card Mobile",
        width: "fill_container",
        descendants: {
          CgJv7: {
            padding: [32, 24, 0, 24],
            layout: "vertical",
            gap: 8,
            alignItems: "center",
            children: [
              brandMark(),
              text("Login Title", "Ifesquare", { fontSize: 20, fontWeight: "600", fill: GREEN[800] }),
              text("Login Subtitle", "Sign in to your shop ledger", { fontSize: 13, fill: "#71717a" }),
            ],
          },
          frWPV: {
            padding: [20, 24],
            layout: "vertical",
            gap: 14,
            children: [
              inputGroup("Email", "mum@shop.ng"),
              inputGroup("Password", "••••••••"),
            ],
          },
          bvhSM: {
            padding: [0, 24, 32, 24],
            layout: "vertical",
            gap: 10,
            alignItems: "center",
            children: [
              {
                type: "ref",
                ref: "s:VSnC2",
                width: "fill_container",
                descendants: { "8jVfJ": { enabled: false }, "8tnXG": { content: "Sign in" } },
              },
              text("Login Footer", "One shop. One login.", { fontSize: 11, fill: "#71717a" }),
            ],
          },
        },
      },
    ],
  };
}

function mobileDashboardScreen(x, y) {
  return {
    type: "frame",
    name: "Dashboard — mobile",
    x,
    y,
    width: 390,
    height: 844,
    fill: "#FFFFFF",
    clip: true,
    layout: "vertical",
    children: [
      {
        type: "frame",
        name: "Mobile Header",
        width: "fill_container",
        layout: "horizontal",
        justifyContent: "space_between",
        alignItems: "center",
        padding: [16, 16],
        stroke: { align: "inside", thickness: { bottom: 1 }, fill: GREEN[100] },
        children: [
          {
            type: "frame",
            name: "Mobile Brand",
            layout: "horizontal",
            gap: 8,
            alignItems: "center",
            children: [
              brandMark(),
              text("Brand", "Ifesquare", { fontSize: 14, fontWeight: "600", fill: GREEN[800] }),
            ],
          },
          icon("Menu", "menu", GREEN[700]),
        ],
      },
      {
        type: "frame",
        name: "Mobile Main",
        width: "fill_container",
        height: "fill_container",
        layout: "vertical",
        gap: 16,
        padding: [16, 16],
        children: [
          {
            type: "frame",
            name: "Mobile Page Header",
            layout: "vertical",
            gap: 4,
            children: [
              text("Title", "Today's ledger", { fontSize: 20, fontWeight: "600", fill: GREEN[800] }),
              text("Date", "Sunday, 12 July 2026", { fontSize: 13, fill: "#71717a" }),
            ],
          },
          {
            type: "ref",
            ref: "s:VSnC2",
            name: "Close Day Mobile",
            width: "fill_container",
            descendants: { "8jVfJ": { enabled: false }, "8tnXG": { content: "Close & save day" } },
          },
          {
            type: "frame",
            name: "Mobile Metrics",
            layout: "vertical",
            gap: 10,
            width: "fill_container",
            children: [
              metricCard("Today's revenue", "₦168,250", "42 units sold"),
              {
                type: "frame",
                name: "Mobile Metrics Row",
                layout: "horizontal",
                gap: 10,
                width: "fill_container",
                children: [
                  metricCard("Units sold", "42", "today"),
                  metricCard("Top product", "Visco 2000", "₦50,400"),
                ],
              },
            ],
          },
          {
            type: "frame",
            name: "Mobile Ledger Scroll",
            width: "fill_container",
            height: "fill_container",
            layout: "vertical",
            clip: true,
            children: [ledgerTable()],
          },
        ],
      },
      {
        type: "frame",
        name: "Mobile Bottom Nav",
        width: "fill_container",
        layout: "horizontal",
        justifyContent: "space_around",
        padding: [12, 8],
        stroke: { align: "inside", thickness: { top: 1 }, fill: GREEN[100] },
        children: [
          { type: "frame", name: "Nav Ledger", layout: "vertical", gap: 4, alignItems: "center", children: [icon("Ledger", "book-open", GREEN[600]), text("Nav", "Ledger", { fontSize: 10, fill: GREEN[700], fontWeight: "500" })] },
          { type: "frame", name: "Nav Products", layout: "vertical", gap: 4, alignItems: "center", children: [icon("Products", "package"), text("Nav", "Products", { fontSize: 10, fill: "#71717a" })] },
          { type: "frame", name: "Nav History", layout: "vertical", gap: 4, alignItems: "center", children: [icon("History", "history"), text("Nav", "History", { fontSize: 10, fill: "#71717a" })] },
        ],
      },
    ],
  };
}

const doc = {
  version: "2.14",
  name: "Ifesquare Shop Ledger",
  theme: { Mode: "Light", Base: "Neutral", Accent: "Green" },
  imports: { s: "shadcn_lib.pen" },
  variables: {
    "--primary": { type: "color", value: GREEN[500] },
    "--primary-foreground": { type: "color", value: "#FFFFFF" },
    "--background": { type: "color", value: "#FFFFFF" },
    "--foreground": { type: "color", value: "#18181b" },
    "--muted-foreground": { type: "color", value: "#71717a" },
    "--border": { type: "color", value: GREEN[100] },
    "--card": { type: "color", value: "#FFFFFF" },
    "--radius": { type: "number", value: 10 },
    "--brand-50": { type: "color", value: GREEN[50] },
    "--brand-600": { type: "color", value: GREEN[600] },
    "--brand-800": { type: "color", value: GREEN[800] },
  },
  children: [
    loginScreen(0),
    dashboardScreen(1540),
    productsScreen(3080),
    bulkAddProductsScreen(3080, 1020),
    historyScreen(4620),
    addProductDialog(6160, 0),
    {
      type: "frame",
      name: "Insights — Pie (tab state)",
      x: 6160,
      y: 960,
      width: 1440,
      height: 360,
      fill: "#FFFFFF",
      clip: true,
      padding: 24,
      children: [insightsCard("pie")],
    },
    {
      type: "frame",
      name: "Insights — Line (tab state)",
      x: 7700,
      y: 960,
      width: 1440,
      height: 360,
      fill: "#FFFFFF",
      clip: true,
      padding: 24,
      children: [insightsCard("line")],
    },
    {
      type: "note",
      name: "Motion handoff",
      x: 9240,
      y: 0,
      width: 340,
      height: 220,
      content:
        "Motion (code):\n• Page load: fade-up 200ms ease-out\n• Row/button hover: bg #F0F9F3\n• Sales/Amount: number transition 300ms\n• No bounce or page transitions",
    },
    {
      type: "note",
      name: "Component mapping",
      x: 9240,
      y: 240,
      width: 340,
      height: 280,
      content:
        "React stack:\n/login → Login Card (Card)\n/ → Dashboard\n  Metrics → Card ×3\n  Ledger → Table + Input cells\n  Insights → Card + Tabs\n  Charts → Recharts Bar/Pie/Line\n  Dialog → Dialog + Input Group\n/products → Table\n/products/bulk-add → editable rows + Add row\n/history → expandable rows\nIcons → lucide-react\nFont → Inter Variable\n\nMobile-only states:\n  Add product → bottom Sheet (not centered Dialog)\n  Hamburger → Drawer (side='right') with 3 nav items + sign out",
    },
    mobileLoginScreen(0, 1400),
    mobileDashboardScreen(440, 1400),
    addProductSheetMobile(880, 1400),
    mobileNavDrawer(1320, 1400),
  ],
};

finalizeDocument(doc);

const out = join(__dir, "ifesquare-dashboard.pen");
writeFileSync(out, JSON.stringify(doc, null, 2));
console.log(`Wrote ${out}`);