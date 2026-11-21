# AICTE FDR Vault — 3D Graphics Architecture & Performance Report
**SIH 2026 | Problem ID SIH26265 | AICTE**

---

## 1. 3D Scene Architecture & Compliance with Spec §9

All 3D experiences are built with pure Three.js, isolated from the critical rendering path:

| Scene | Location | Technical Implementation | Fallback Strategy |
|---|---|---|---|
| **LoginVaultScene** | `/login` background | Navy vault door cylinder, rotating Saffron glowing torus, instanced particles (150 count), gentle cursor parallax. Opens on success, camera shake on failure. | CSS gradient background (`from-[#07132e] via-[#0b1f4b] to-[#040a1a]`) if WebGL is unavailable. |
| **DepositGlobeScene** | Dashboard Hero | Wireframe sphere + core with 3D pin spikes positioned by geographical coordinates. Tooltips and interaction filters. | 2D stylized SVG card with state distribution metrics. |
| **LiquidityBarsScene** | `/liquidity-ladder` | 12 monthly 3D columns with urgency colors (Red $\le 30$d, Orange $\le 60$d, Amber $\le 90$d, Emerald $> 90$d). | Recharts SVG Bar Chart mirroring identical data. |
| **FdrCertificateCard** | FDR 360 View | Cursor-tilt 3D security deposit certificate card with metallic finish and glowing torus completeness gauge. | High-contrast 2D card with CSS border accent. |
| **ReleaseSealScene** | Release Order Page | Stamping animation of AICTE official digital seal with 60-particle explosive burst on Mark Released action. | Green verified badge and seal stamp. |
| **FloatingEmptyScene** | `/404` and Empty Queues | Floating low-poly geometric solids (octahedron, icosahedron, torus, tetrahedron) bobbing with sine wave offsets. | Clean text empty state with Lucide icons. |

---

## 2. Strict Performance Guardrails

1. **DPR Capping**: Capped at `Math.min(window.devicePixelRatio, 1.5)` on desktop and `1.0` on mobile.
2. **WebGL Availability Guard**: Explicit `canvas.getContext('webgl')` check before mounting; graceful fallback if absent.
3. **Power Preference**: Configured with `powerPreference: 'low-power'` in WebGLRenderer.
4. **Lifecycle & Memory Management**: Every geometry, material, and listener is cleanly disposed on React component unmount to prevent GPU memory leaks.
5. **No Critical Data in 3D**: 100% of information and action buttons remain fully functional even if WebGL is disabled.
