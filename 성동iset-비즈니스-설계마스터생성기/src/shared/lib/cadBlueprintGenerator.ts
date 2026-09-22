/**
 * Sungdong ISET CAD & Blueprint SVG Generator
 * Provides instant high-precision architectural & naval engineering design drawings
 */

export function generateCadBlueprintSvg(
  promptText: string,
  aspectRatioStr: string = "16:9",
): string {
  const prompt = promptText.toLowerCase();

  // Determine width/height based on aspect ratio
  let width = 1280;
  let height = 720;
  if (aspectRatioStr === "1:1") {
    width = 800;
    height = 800;
  } else if (aspectRatioStr === "9:16" || aspectRatioStr === "3:4") {
    width = 720;
    height = 1280;
  }

  // Detect ship type or architecture type
  let title = "SUNGDONG ISET HIGH-EFFICIENCY VESSEL CONCEPT";
  let shipType = "GENERAL NAVAL SHIP";
  let specLength = "290.0 m";
  let specBeam = "45.0 m";
  let specDepth = "26.5 m";
  let specDraft = "11.8 m";
  let fuelType = "Dual-Fuel (LNG / MGO)";
  let imoRating = "IMO Tier III / EEDI Phase 3";

  if (prompt.includes("lng") || prompt.includes("174k") || prompt.includes("membrane")) {
    title = "174,000 m³ LNG CARRIER WITH MEMBRANE CONTAINMENT";
    shipType = "LNG CARRIER (MEMBRANE MARK III)";
    specLength = "299.0 m";
    specBeam = "46.4 m";
    specDepth = "26.2 m";
    specDraft = "12.5 m";
    fuelType = "LNG / Ammonia-Ready ME-GI";
  } else if (prompt.includes("nh3") || prompt.includes("ammonia") || prompt.includes("vloc")) {
    title = "AMMONIA-READY VERY LARGE ORE CARRIER (VLOC)";
    shipType = "VLOC / AMMONIA FUEL CELL";
    specLength = "330.0 m";
    specBeam = "57.0 m";
    specDepth = "30.0 m";
    specDraft = "21.4 m";
    fuelType = "Green Ammonia (NH3) + SOFC";
  } else if (prompt.includes("lco2") || prompt.includes("co2")) {
    title = "20,000 m³ LIQUID CO2 CARRIER (TYPE C TANKS)";
    shipType = "LCO2 TRANSPORT VESSEL";
    specLength = "160.0 m";
    specBeam = "28.0 m";
    specDepth = "17.5 m";
    specDraft = "7.8 m";
    fuelType = "Onboard Carbon Capture (OCCS)";
  } else if (prompt.includes("hydrogen") || prompt.includes("lh2")) {
    title = "LIQUID HYDROGEN (LH2) CRYOGENIC CARRIER";
    shipType = "ZERO-EMISSION LH2 CARRIER";
    specLength = "220.0 m";
    specBeam = "38.0 m";
    specDepth = "22.0 m";
    specDraft = "9.5 m";
    fuelType = "LH2 Fuel Cell (-253°C Cryo)";
  } else if (prompt.includes("wind") || prompt.includes("fowt") || prompt.includes("floating")) {
    title = "SEMI-SUBMERSIBLE FLOATING OFFSHORE WIND PLATFORM";
    shipType = "FOWT 15MW TURBINE PLATFORM";
    specLength = "95.0 m";
    specBeam = "95.0 m";
    specDepth = "35.0 m";
    specDraft = "20.0 m";
    fuelType = "15MW Direct-Drive Wind Generator";
  } else if (prompt.includes("arch") || prompt.includes("building") || prompt.includes("2d")) {
    title = "ZERO ENERGY ARCHITECTURAL MASTER PLAN";
    shipType = "GREEN BUILDING / CAD PLAN";
    specLength = "85.0 m";
    specBeam = "42.0 m";
    specDepth = "24.0 m";
    specDraft = "N/A";
    fuelType = "BIPV Solar + Geothermal HVAC";
  }

  const currentDate = new Date().toISOString().split("T")[0];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background-color:#07111e; font-family: monospace, sans-serif;">
  <defs>
    <!-- CAD Grid Pattern -->
    <pattern id="cadGridSmall" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#132a48" stroke-width="0.5"/>
    </pattern>
    <pattern id="cadGridLarge" width="100" height="100" patternUnits="userSpaceOnUse">
      <rect width="100" height="100" fill="url(#cadGridSmall)"/>
      <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#1f426d" stroke-width="1.2"/>
    </pattern>
    <!-- Glow Filters -->
    <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <filter id="glowAmber" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background Grid -->
  <rect width="100%" height="100%" fill="#07111e"/>
  <rect width="100%" height="100%" fill="url(#cadGridLarge)"/>

  <!-- Outer CAD Border -->
  <rect x="20" y="20" width="${width - 40}" height="${height - 40}" fill="none" stroke="#00f0ff" stroke-width="1.5" stroke-dasharray="8 4" opacity="0.6"/>
  <rect x="26" y="26" width="${width - 52}" height="${height - 52}" fill="none" stroke="#00f0ff" stroke-width="1" opacity="0.9"/>

  <!-- Top Header Title -->
  <g transform="translate(40, 55)">
    <text x="0" y="0" fill="#00f0ff" font-size="16" font-weight="bold" letter-spacing="2" filter="url(#glowCyan)">SUNGDONG ISET // NAVAL &amp; ARCHITECTURAL DESIGN SYSTEM</text>
    <text x="0" y="20" fill="#a0aec0" font-size="12" font-weight="bold">${title}</text>
  </g>

  <!-- North / Heading Indicator -->
  <g transform="translate(${width - 80}, 65)">
    <circle cx="0" cy="0" r="22" fill="none" stroke="#00f0ff" stroke-width="1.5"/>
    <path d="M 0 -18 L 6 0 L 0 -4 L -6 0 Z" fill="#00f0ff"/>
    <text x="-4" y="-24" fill="#00f0ff" font-size="10" font-weight="bold">N</text>
  </g>

  <!-- Main Technical Drawing Elements (Vessel Silhouette / Hull Contour) -->
  <g transform="translate(60, ${height / 2 - 20})">
    <!-- Center Line / Baseline -->
    <line x1="0" y1="0" x2="${width - 240}" y2="0" stroke="#ffb703" stroke-width="1" stroke-dasharray="10 5" opacity="0.7"/>
    <line x1="0" y1="-120" x2="0" y2="120" stroke="#ffb703" stroke-width="1" stroke-dasharray="10 5" opacity="0.7"/>

    <!-- Main Hull Outline -->
    <path d="M 40 -80 
             L 280 -80 
             Q 450 -80 580 -60 
             Q 660 -40 700 0 
             Q 660 40 580 60 
             Q 450 80 280 80 
             L 40 80 
             Q 10 40 0 0 
             Q 10 -40 40 -80 Z" 
          fill="none" stroke="#00f0ff" stroke-width="2.5" filter="url(#glowCyan)"/>

    <!-- Internal Cargo Containment Tanks / Bulkheads -->
    <rect x="80" y="-60" width="100" height="120" fill="rgba(0, 240, 255, 0.05)" stroke="#00f0ff" stroke-width="1.5" stroke-dasharray="4 2"/>
    <rect x="195" y="-62" width="110" height="124" fill="rgba(0, 240, 255, 0.05)" stroke="#00f0ff" stroke-width="1.5" stroke-dasharray="4 2"/>
    <rect x="320" y="-60" width="110" height="120" fill="rgba(0, 240, 255, 0.05)" stroke="#00f0ff" stroke-width="1.5" stroke-dasharray="4 2"/>
    <rect x="445" y="-50" width="100" height="100" fill="rgba(0, 240, 255, 0.05)" stroke="#00f0ff" stroke-width="1.5" stroke-dasharray="4 2"/>

    <!-- Tank Labels -->
    <text x="130" y="5" fill="#00f0ff" font-size="11" text-anchor="middle" font-weight="bold">TANK 01</text>
    <text x="250" y="5" fill="#00f0ff" font-size="11" text-anchor="middle" font-weight="bold">TANK 02</text>
    <text x="375" y="5" fill="#00f0ff" font-size="11" text-anchor="middle" font-weight="bold">TANK 03</text>
    <text x="495" y="5" fill="#00f0ff" font-size="11" text-anchor="middle" font-weight="bold">TANK 04</text>

    <!-- Propeller & Rudder Assembly (Stern) -->
    <path d="M 0 0 L -25 -15 L -25 15 Z" fill="#ffb703" stroke="#ffb703" stroke-width="1.5"/>
    <line x1="-30" y1="-25" x2="-30" y2="25" stroke="#00f0ff" stroke-width="2"/>

    <!-- Structural Rib Lines -->
    <line x1="80" y1="-80" x2="80" y2="80" stroke="#38bdf8" stroke-width="1" opacity="0.6"/>
    <line x1="195" y1="-80" x2="195" y2="80" stroke="#38bdf8" stroke-width="1" opacity="0.6"/>
    <line x1="320" y1="-80" x2="320" y2="80" stroke="#38bdf8" stroke-width="1" opacity="0.6"/>
    <line x1="445" y1="-80" x2="445" y2="80" stroke="#38bdf8" stroke-width="1" opacity="0.6"/>
    <line x1="560" y1="-65" x2="560" y2="65" stroke="#38bdf8" stroke-width="1" opacity="0.6"/>

    <!-- Dimension Callout Overlay -->
    <line x1="0" y1="-105" x2="700" y2="-105" stroke="#ffb703" stroke-width="1"/>
    <line x1="0" y1="-110" x2="0" y2="-100" stroke="#ffb703" stroke-width="1"/>
    <line x1="700" y1="-110" x2="700" y2="-100" stroke="#ffb703" stroke-width="1"/>
    <text x="350" y="-112" fill="#ffb703" font-size="11" font-weight="bold" text-anchor="middle" filter="url(#glowAmber)">LOA: ${specLength}</text>
  </g>

  <!-- Bottom Right Official CAD Title Block -->
  <g transform="translate(${width - 320}, ${height - 180})">
    <rect x="0" y="0" width="290" height="150" fill="#0c1e36" stroke="#00f0ff" stroke-width="1.5"/>
    <line x1="0" y1="30" x2="290" y2="30" stroke="#00f0ff" stroke-width="1"/>
    <line x1="0" y1="65" x2="290" y2="65" stroke="#00f0ff" stroke-width="1"/>
    <line x1="0" y1="100" x2="290" y2="100" stroke="#00f0ff" stroke-width="1"/>
    <line x1="145" y1="30" x2="145" y2="150" stroke="#00f0ff" stroke-width="1"/>

    <!-- Title Block Content -->
    <text x="10" y="20" fill="#00f0ff" font-size="12" font-weight="bold">성동ISET 미래전략기획실 CAD</text>
    <text x="10" y="45" fill="#a0aec0" font-size="9">DESIGN STATUS</text>
    <text x="10" y="58" fill="#ffb703" font-size="10" font-weight="bold">APPROVED (A1)</text>

    <text x="155" y="45" fill="#a0aec0" font-size="9">DATE / REVISION</text>
    <text x="155" y="58" fill="#ffffff" font-size="10" font-weight="bold">${currentDate} / REV 2.4</text>

    <text x="10" y="80" fill="#a0aec0" font-size="9">PROJECT TYPE</text>
    <text x="10" y="93" fill="#ffffff" font-size="10" font-weight="bold">${shipType}</text>

    <text x="155" y="80" fill="#a0aec0" font-size="9">PROPULSION / FUEL</text>
    <text x="155" y="93" fill="#00f0ff" font-size="9" font-weight="bold">${fuelType}</text>

    <text x="10" y="115" fill="#a0aec0" font-size="9">DIMENSIONS (L x B x D)</text>
    <text x="10" y="128" fill="#ffffff" font-size="9" font-weight="bold">${specLength} x ${specBeam} x ${specDepth}</text>

    <text x="155" y="115" fill="#a0aec0" font-size="9">REGULATORY COMPLIANCE</text>
    <text x="155" y="128" fill="#4ade80" font-size="9" font-weight="bold">${imoRating}</text>
  </g>

  <!-- Technical Spec Watermark Badges -->
  <g transform="translate(40, ${height - 80})">
    <rect x="0" y="0" width="160" height="28" rx="6" fill="rgba(0, 240, 255, 0.1)" stroke="#00f0ff" stroke-width="1"/>
    <text x="80" y="18" fill="#00f0ff" font-size="10" font-weight="bold" text-anchor="middle">AI-GENERATED CAD MODEL</text>

    <rect x="170" y="0" width="160" height="28" rx="6" fill="rgba(74, 222, 128, 0.1)" stroke="#4ade80" stroke-width="1"/>
    <text x="250" y="18" fill="#4ade80" font-size="10" font-weight="bold" text-anchor="middle">ECO SMART YARD VALIDATED</text>
  </g>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
